import StudentFeedback from '../models/StudentFeedback.js';
import CurriculumFlag from '../models/CurriculumFlag.js';
import Sentiment from 'sentiment';

const sentiment = new Sentiment();

export const submitFeedback = async (req, res) => {
  try {
    const { uploadId, responses, classId, semester } = req.body;
    
    const processedResponses = responses.map(r => {
      const result = r.feedbackText ? sentiment.analyze(r.feedbackText) : { score: null };
      return { ...r, sentimentScore: result.score };
    });

    await StudentFeedback.create({
      studentId: req.user.studentId,
      classId, semester, uploadId,
      responses: processedResponses
    });
    
   
   

    res.json({ message: 'Feedback submitted. Thank you.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getFeedbackStatus = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const existing = await StudentFeedback.findOne({ studentId: req.user.studentId, uploadId });
    res.json({ hasFeedback: !!existing });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getClassFeedbackSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    const feedbacks = await StudentFeedback.find({ classId });
    
    if (feedbacks.length === 0) {
      return res.json({ subjects: [], overallResponseRate: 0, responseCount: 0 });
    }

    const subjectMap = {};
    for (const f of feedbacks) {
      for (const r of f.responses) {
        if (!subjectMap[r.subject]) {
          subjectMap[r.subject] = {
            subject: r.subject,
            responseCount: 0,
            sumDiff: 0,
            difficultyDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            sumSentiment: 0,
            sentimentCount: 0,
            topFeedbackSamples: [],
          };
        }
        const sMap = subjectMap[r.subject];
        sMap.responseCount++;
        sMap.sumDiff += r.difficultyRating;
        sMap.difficultyDistribution[r.difficultyRating] = (sMap.difficultyDistribution[r.difficultyRating] || 0) + 1;
        
        if (r.sentimentScore !== null) {
          sMap.sumSentiment += r.sentimentScore;
          sMap.sentimentCount++;
          if (r.feedbackText && r.feedbackText.length > 5 && sMap.topFeedbackSamples.length < 5) {
            sMap.topFeedbackSamples.push(r.feedbackText);
          }
        }
      }
    }

   
    const flags = await CurriculumFlag.find({ 
      subject: { $in: Object.keys(subjectMap) }, 
      flagSeverity: { $in: ['critical', 'concern'] } 
    });
    const flaggedSubjects = flags.map(f => f.subject);

    const subjectsArray = Object.values(subjectMap).map(sMap => ({
      subject: sMap.subject,
      responseCount: sMap.responseCount,
      avgDifficultyRating: parseFloat((sMap.sumDiff / sMap.responseCount).toFixed(1)),
      difficultyDistribution: sMap.difficultyDistribution,
      avgSentimentScore: sMap.sentimentCount > 0 ? parseFloat((sMap.sumSentiment / sMap.sentimentCount).toFixed(1)) : 0,
      topFeedbackSamples: sMap.topFeedbackSamples.slice(0, 2),
      isFlaggedAsCurriculumIssue: flaggedSubjects.includes(sMap.subject)
    }));

   
    const overallResponseRate = Math.min(100, Math.round((feedbacks.length / 60) * 100));

    res.json({ subjects: subjectsArray, overallResponseRate, responseCount: feedbacks.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAdminFeedbackOverview = async (req, res) => {
  try {
    const feedbacks = await StudentFeedback.find({});
    res.json({ heatmapData: [], totalFeedbackCount: feedbacks.length, flaggedSubjects: 0 }); 
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
