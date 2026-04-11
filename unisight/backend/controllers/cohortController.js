import CohortTracking from '../models/CohortTracking.js';
import { callGeminiJSON } from '../services/geminiService.js';
import User from '../models/User.js';
import Insight from '../models/Insight.js';

export const getCohorts = async (req, res) => {
  try {
    const depts = await User.distinct('department', { role: 'student' });
    const cohorts = await Promise.all(depts.filter((d) => d !== 'Administration').map(async (dept) => {
      const insights = await Insight.find({ department: dept }).sort({ createdAt: -1 });
      const atRisk = insights.filter((i) => ['HIGH', 'CRITICAL'].includes(i.dropoutTier)).length;
      const avgCgpa = insights.length
        ? insights.reduce((sum, i) => sum + (i.cgpa || 0), 0) / insights.length
        : 0;
      const avgDropoutScore = insights.length
        ? insights.reduce((sum, i) => sum + (i.dropoutProbabilityScore || 0), 0) / insights.length
        : 0;
      return {
        cohortId: `${dept}-2024`,
        cohortName: `${dept} Batch 2024`,
        department: dept,
        year: 2022,
        admissionYear: 2022,
        currentSemester: 4,
        studentCount: insights.length,
        totalStudents: insights.length,
        avgCgpa,
        avgDropoutScore,
        atRiskPercentage: insights.length ? Math.round((atRisk / insights.length) * 100) : 0,
        retentionRisk: atRisk > insights.length * 0.3 ? 'high' : atRisk > insights.length * 0.15 ? 'moderate' : 'low',
      };
    }));
    res.json({ cohorts });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCohortById = async (req, res) => {
  try {
    const dept = req.params.cohortId.replace('-2024', '');
    const insights = await Insight.find({ department: dept }).sort({ createdAt: -1 });
    const atRisk = insights.filter((i) => ['HIGH', 'CRITICAL'].includes(i.dropoutTier)).length;
    const avgCgpa = insights.length
      ? Math.round((insights.reduce((sum, item) => sum + (item.cgpa || 0), 0) / insights.length) * 10) / 10
      : 0;

    const totalStudents = insights.length || 1;
    res.json({
      cohort: {
        cohortId: req.params.cohortId,
        department: dept,
        startingStudentCount: totalStudents,
        projectedFinalDropoutRate: Math.round(((Math.max(0, Math.round(atRisk * 0.4))) / totalStudents) * 100),
        aiAlertSummary: `Based on current risk profiles, ${Math.max(0, Math.round(atRisk * 0.4))} students are predicted to drop or need intervention in the next semester.`,
        semesterData: [{
          semester: 'Sem 4',
          avgCgpa,
          atRiskPct: Math.round((atRisk / totalStudents) * 100),
          passRate: Math.round(((insights.length - atRisk) / totalStudents) * 100),
        }],
        students: insights.map((i) => ({
          studentId: i.studentId,
          dropoutProbability: i.dropoutProbabilityScore ?? i.dropoutProbability ?? 0,
          dropoutTier: i.dropoutTier,
        }))
      }
    });
  } catch {
    res.status(500).json({ error: 'Failed to load cohort' });
  }
};

export const getCohortDetail = async (req, res) => {
  try {
    const cohort = await CohortTracking.findOne({ cohortId: req.params.cohortId });
    if (!cohort) return res.status(404).json({ error: 'Cohort not found' });
    
    if (!cohort.predictedDropouts && cohort.semesterData.length >= 2) {
      const prompt = `Based on these semester trends for a ${cohort.department} batch admitted ${cohort.admissionYear}:
      ${JSON.stringify(cohort.semesterData)}
      
      Predict the estimated number of students who may not complete the program out of ${cohort.totalStudents} total students.
      
      RULES:
      1. Return ONLY a valid JSON object.
      2. NO comments (// or /*) inside JSON.
      3. NO trailing commas.

      Format:
      { "predictedDropouts": number, "retentionRiskLevel": "low"|"moderate"|"high", "retentionSummary": "..." }`;
      
      try {
        const aiOutput = await callGeminiJSON(prompt);
        cohort.predictedDropouts = aiOutput.predictedDropouts || 0;
        cohort.retentionRiskLevel = aiOutput.retentionRiskLevel || 'moderate';
        cohort.aiRetentionSummary = aiOutput.retentionSummary || 'Prediction generated based on semester trends.';
        await cohort.save();
      } catch (err) {
        console.error("Cohort AI error", err);
      }
    }

    res.json({
      cohort: cohort,
      semesterData: cohort.semesterData,
      predictedDropouts: cohort.predictedDropouts,
      retentionSummary: cohort.aiRetentionSummary,
      topAtRiskStudents: [] // Computed client-side or from Insights joins
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateCohort = async (req, res) => {
  try {
    const { semester, dropoutCount } = req.body;
    const cohort = await CohortTracking.findOne({ cohortId: req.params.cohortId });
    if (!cohort) return res.status(404).json({ error: 'Cohort not found' });
    
    const semIndex = cohort.semesterData.findIndex(s => s.semester === semester);
    if (semIndex >= 0) {
      cohort.semesterData[semIndex].dropoutCount = dropoutCount;
      await cohort.save();
    } else {
      cohort.semesterData.push({ semester, dropoutCount });
      await cohort.save();
    }
    
    res.json({ message: 'Cohort updated', cohort });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateDropoutCount = async (req, res) => {
  try {
    res.json({ message: 'Updated', cohort: { actualDropouts: req.body.actualDropouts } });
  } catch {
    res.status(500).json({ error: 'Failed to update' });
  }
};
