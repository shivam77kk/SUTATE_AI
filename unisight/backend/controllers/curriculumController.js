import CurriculumFlag from '../models/CurriculumFlag.js';
import Marks from '../models/Marks.js';
import { callGeminiJSON } from '../services/geminiService.js';

export const getCurriculum = async (_req, res) => {
  try {
    const subjects = await Marks.aggregate([
      {
        $group: {
          _id: { subject: '$subject', dept: '$department' },
          avg: {
            $avg: {
              $add: ['$scores.ut1', '$scores.midSem', '$scores.ut2', '$scores.endSem'],
            },
          },
          count: { $sum: 1 },
          fail: {
            $sum: {
              $cond: [
                {
                  $lt: [
                    { $add: ['$scores.ut1', '$scores.midSem', '$scores.ut2', '$scores.endSem'] },
                    40,
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          subject: '$_id.subject',
          department: '$_id.dept',
          avgScore: { $round: ['$avg', 1] },
          total: '$count',
          failCount: '$fail',
          failureRate: { $multiply: [{ $divide: ['$fail', '$count'] }, 100] },
        },
      },
      { $sort: { failureRate: -1 } },
    ]);

    const aiFlags = await CurriculumFlag.find({}).lean();

    const flags = subjects.map((s) => {
      const aiMatch = aiFlags.find(f => f.subject === s.subject && f.department === s.department);
      const severity = s.failureRate > 20 ? 'high' : s.failureRate > 10 ? 'medium' : 'low';
      
      return {
        subject: s.subject,
        department: s.department,
        severity,
        issue: aiMatch?.aiAnalysis || `${s.subject} shows a ${Math.round(s.failureRate)}% failure rate with an average score of ${s.avgScore}.`,
        recommendation: aiMatch?.recommendedActions?.[0] || (s.failureRate > 20 ? 'Immediate curriculum review required' : 'Monitor and provide additional support'),
        failureRate: Math.round(s.failureRate),
        avgScore: s.avgScore,
        totalStudents: s.total,
      };
    });

    const summary = flags.length > 0 
      ? `Analysis complete: ${flags.filter(f => f.severity === 'high').length} high-priority subjects need immediate attention.`
      : 'All subjects are performing within acceptable ranges.';

    res.json({ 
      flags, 
      summary,
      analysis: { total: subjects.length, flagged: flags.length }
    });
  } catch (err) {
    console.error('[Curriculum] Error:', err);
    res.status(500).json({ error: 'Failed to load curriculum data' });
  }
};

export const analyseCurriculum = async (_req, res) => {
  try {
    const subjects = await Marks.aggregate([
      {
        $group: {
          _id: { subject: '$subject', dept: '$department' },
          avg: {
            $avg: {
              $add: ['$scores.ut1', '$scores.midSem', '$scores.ut2', '$scores.endSem'],
            },
          },
          count: { $sum: 1 },
          fail: {
            $sum: {
              $cond: [
                {
                  $lt: [
                    { $add: ['$scores.ut1', '$scores.midSem', '$scores.ut2', '$scores.endSem'] },
                    40,
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const fallback = subjects.map((s) => ({
      subject: s._id.subject,
      department: s._id.dept,
      failureRate: Math.round((s.fail / s.count) * 100),
      severity: (s.fail / s.count) > 0.4 ? 'high' : (s.fail / s.count) > 0.25 ? 'medium' : 'low',
      issue: `${s._id.subject} has a ${Math.round((s.fail / s.count) * 100)}% failure rate.`,
      recommendation: (s.fail / s.count) > 0.4 ? 'Immediate curriculum review required' : 'Monitor and provide additional support',
    }));

    let analysis;
    try {
      const prompt = `Analyse these subjects and identify curriculum bottlenecks: ${JSON.stringify(fallback)}. Return JSON array with fields: subject, department, severity, issue, recommendation.`;
      analysis = await callGeminiJSON(prompt, fallback);
    } catch (geminiErr) {
      console.error('[Curriculum] Gemini error:', geminiErr);
      analysis = fallback;
    }

    const analysisResults = analysis || fallback;
    
    // Persist results to CurriculumFlag so they show up in getCurriculum
    for (const resItem of analysisResults) {
      await CurriculumFlag.findOneAndUpdate(
        { subject: resItem.subject, department: resItem.department },
        { 
          ...resItem,
          flagSeverity: resItem.severity === 'high' ? 'critical' : (resItem.severity === 'medium' ? 'concern' : 'watch'),
          aiAnalysis: resItem.issue,
          recommendedActions: [resItem.recommendation],
          lastUpdated: new Date()
        },
        { upsert: true }
      );
    }

    const summary = `Analysis complete: ${(analysisResults || []).filter(a => a.severity === 'high').length} high-priority subjects identified and persisted.`;

    res.json({ 
      flags: analysisResults,
      summary,
      analysis: { analysed: subjects.length, flagged: (analysisResults).length }
    });
  } catch (err) {
    console.error('[Curriculum] Analysis error:', err);
    res.status(500).json({ error: 'Curriculum analysis failed: ' + err.message });
  }
};

export const getCurriculumFlags = async (req, res) => {
  try {
    const flags = await CurriculumFlag.find({}).sort({ flagSeverity: 1, semestersFlagged: -1 });
    const summary = { total: flags.length, critical: 0, concern: 0, watch: 0 };
    flags.forEach(f => { if(summary[f.flagSeverity] !== undefined) summary[f.flagSeverity]++; });
    res.json({ flags, summary });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const runCurriculumAnalysis = async (req, res) => {
  try {
    const allMarks = await Marks.find({});
    const subjectStats = {};
    
    for (const m of allMarks) {
      const key = `${m.subject}_${m.department}`;
      if (!subjectStats[key]) {
        subjectStats[key] = { subject: m.subject, department: m.department, total: 0, failed: 0, semesters: new Set() };
      }
      subjectStats[key].total++;
      if (m.scores && Object.keys(m.scores).length) {
         const sum = Object.values(m.scores).reduce((acc, obj) => acc + (obj || 0), 0);
         if (sum < 40) subjectStats[key].failed++;
      }
      subjectStats[key].semesters.add(m.semester);
    }
    
    const flagged = [];
    for (const stats of Object.values(subjectStats)) {
      const failRate = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;
      if (failRate >= 35 && stats.semesters.size >= 2) {
        flagged.push({
          subject: stats.subject,
          department: stats.department,
          avgFailureRate: Math.round(failRate),
          semestersFlagged: stats.semesters.size,
          totalStudents: stats.total,
          totalFailed: stats.failed
        });
      }
    }

    if (flagged.length > 0) {
      const prompt = `Analyse these subjects flagged as having systemic high failure rates:
      ${JSON.stringify(flagged)}
      
      RULES:
      1. Return ONLY a valid JSON array of objects.
      2. NO comments (// or /*) inside JSON.
      3. NO trailing commas.

      Format:
      [{ "subject": "...", "department": "...", "aiAnalysis": "...", "recommendedActions": ["...", "..."] }]`;
      
      let aiResponse;
      try {
        aiResponse = await callGeminiJSON(prompt);
      } catch(e) { aiResponse = []; }
      
      for (const flag of flagged) {
        const aiData = (aiResponse || []).find(a => a.subject === flag.subject && a.department === flag.department);
        await CurriculumFlag.findOneAndUpdate(
          { subject: flag.subject, department: flag.department },
          {
            ...flag,
            flagSeverity: flag.avgFailureRate > 50 ? 'critical' : (flag.avgFailureRate > 40 ? 'concern' : 'watch'),
            aiAnalysis: aiData?.aiAnalysis || 'Systemic high failure rate observed across multiple semesters.',
            recommendedActions: aiData?.recommendedActions || ['Review course material pacing', 'Schedule remedial classes'],
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
      }
    }
    res.json({ analysed: Object.keys(subjectStats).length, flagged: flagged.length, message: 'Analysis complete', flags: flagged });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
