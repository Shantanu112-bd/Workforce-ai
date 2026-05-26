import { AgentInputField } from '@/types'

// ============================================
// Agent Input Schema Registry
// Defines the form fields for each agent
// ============================================

export const AGENT_INPUT_SCHEMAS: Record<string, Record<string, AgentInputField>> = {
  'linkedin-tech-post': {
    github_url: {
      type: 'url',
      label: 'GitHub Repository URL',
      placeholder: 'https://github.com/username/repo-name',
      required: true,
      helpText: 'Public repo only. We\'ll fetch the README and key files.',
    },
    audience: {
      type: 'select',
      label: 'Target Audience',
      required: true,
      options: ['Technical — Engineers & Developers', 'Recruiters & Hiring Managers', 'General — Mixed Audience'],
      default: 'Technical — Engineers & Developers',
    },
    tone: {
      type: 'select',
      label: 'Tone',
      required: true,
      options: ['Professional', 'Friendly & Conversational', 'Casual'],
      default: 'Professional',
    },
    extra_context: {
      type: 'textarea',
      label: 'Extra Context (optional)',
      placeholder: 'Key metrics, why you built this, anything you want highlighted...',
      maxLength: 500,
    },
    highlight_metrics: {
      type: 'boolean',
      label: 'Highlight metrics & impact numbers',
      default: false,
    },
  },

  'resume-ats-optimizer': {
    resume_text: {
      type: 'textarea',
      label: 'Paste Your Resume',
      placeholder: 'Paste the full text of your current resume here...',
      required: true,
      maxLength: 5000,
    },
    job_description: {
      type: 'textarea',
      label: 'Target Job Description',
      placeholder: 'Paste the job description you\'re applying to...',
      required: true,
      maxLength: 3000,
    },
    role_level: {
      type: 'select',
      label: 'Role Level',
      required: true,
      options: ['Entry Level (0–2 years)', 'Mid Level (2–5 years)', 'Senior (5–8 years)', 'Staff / Principal (8+ years)'],
    },
    industry: {
      type: 'select',
      label: 'Industry',
      options: ['Software Engineering', 'Data Science / ML', 'Product Management', 'Design', 'DevOps / Platform', 'Other'],
    },
  },

  'github-portfolio': {
    github_username: {
      type: 'text',
      label: 'GitHub Username',
      placeholder: 'e.g. torvalds',
      required: true,
    },
    highlight_repos: {
      type: 'text',
      label: 'Highlight These Repos (optional)',
      placeholder: 'repo1, repo2, repo3 — comma separated',
      helpText: 'Leave blank to auto-select your top repos.',
    },
    style: {
      type: 'select',
      label: 'README Style',
      options: ['Minimal & Clean', 'Detailed with stats', 'Creative with badges', 'Corporate / Professional'],
      default: 'Minimal & Clean',
    },
    include_stats: {
      type: 'boolean',
      label: 'Include GitHub stats card',
      default: true,
    },
  },

  'meeting-notes-ai': {
    transcript: {
      type: 'textarea',
      label: 'Meeting Transcript',
      placeholder: 'Paste your meeting transcript here... You can include speaker names like "John: ..." or just paste raw text.',
      required: true,
      maxLength: 8000,
    },
    meeting_type: {
      type: 'select',
      label: 'Meeting Type',
      options: ['Sprint Planning', 'Standup', 'Design Review', 'Client Call', 'Strategy / Planning', 'One-on-One', 'All Hands', 'Other'],
      default: 'Other',
    },
    output_format: {
      type: 'select',
      label: 'Output Format',
      options: ['Summary + Action Items', 'Full Structured Notes', 'Slack Update (short)', 'Email Summary'],
      default: 'Summary + Action Items',
    },
  },

  'assignment-verifier': {
    assignment_text: {
      type: 'textarea',
      label: 'Student Submission',
      placeholder: 'Paste the student\'s assignment text here...',
      required: true,
      maxLength: 6000,
    },
    assignment_brief: {
      type: 'textarea',
      label: 'Assignment Brief / Rubric (optional)',
      placeholder: 'What was the task? What criteria should it meet?',
      maxLength: 1000,
    },
    subject: {
      type: 'text',
      label: 'Subject / Course',
      placeholder: 'e.g. Introduction to Computer Science',
    },
    check_ai_usage: {
      type: 'boolean',
      label: 'Check for AI-generated content',
      default: true,
    },
  },

  'social-media-pack': {
    topic: {
      type: 'textarea',
      label: 'Topic or Content Idea',
      placeholder: 'What do you want to post about? Be specific — the more detail, the better.',
      required: true,
      maxLength: 500,
    },
    brand_voice: {
      type: 'select',
      label: 'Brand Voice',
      options: ['Professional', 'Casual & Relatable', 'Educational', 'Inspirational', 'Witty & Humorous'],
      default: 'Professional',
    },
    platforms: {
      type: 'select',
      label: 'Platforms',
      options: ['All (Twitter/X, LinkedIn, Instagram)', 'Twitter/X only', 'LinkedIn only', 'Instagram only', 'Twitter/X + LinkedIn'],
      default: 'All (Twitter/X, LinkedIn, Instagram)',
    },
    include_cta: {
      type: 'boolean',
      label: 'Include call-to-action in each post',
      default: true,
    },
  },
}

// ============================================
// Gemini Prompt Templates
// ============================================

export const AGENT_PROMPTS: Record<string, string> = {
  'linkedin-tech-post': `You are a professional LinkedIn content writer specializing in tech projects.

Given this GitHub repository information:
{repo_data}

Target audience: {audience}
Tone: {tone}
Extra context: {extra_context}
Highlight metrics: {highlight_metrics}

Write a compelling LinkedIn post that:
1. Opens with a strong hook (question, bold statement, or story)
2. Explains what the project does and why it matters
3. Highlights key technical decisions or challenges overcome
4. Ends with a question or CTA to drive engagement
5. Includes 4-6 relevant hashtags

Format your response as JSON:
{
  "post_body": "full post text here",
  "hashtags": ["#Tag1", "#Tag2", ...],
  "metadata": {
    "repo_name": "...",
    "key_tech": ["...", "..."],
    "character_count": 0
  }
}`,

  'resume-ats-optimizer': `You are an expert ATS optimization specialist and career coach.

Resume to optimize:
{resume_text}

Target job description:
{job_description}

Role level: {role_level}
Industry: {industry}

Analyze the resume against the job description and provide:
1. An ATS compatibility score (0-100)
2. Key missing keywords from the JD
3. A fully rewritten resume optimized for this specific role
4. Top 5 specific improvement suggestions

Format as JSON:
{
  "score": 0-100,
  "missing_keywords": ["keyword1", ...],
  "rewritten_resume": "full resume text",
  "suggestions": ["suggestion 1", ...],
  "metadata": { "matched_keywords": [...], "total_keywords": 0 }
}`,

  'github-portfolio': `You are a professional developer portfolio writer and GitHub expert.

GitHub username: {github_username}
Highlight repos: {highlight_repos}
README style: {style}
Include stats: {include_stats}

Analyze the developer's GitHub profile and create a stunning profile README that:
1. Opens with a personalized hero section and brief bio
2. Showcases top repositories with descriptions and tech stacks
3. Includes relevant badges and stats (if requested)
4. Highlights skills, languages, and contributions
5. Ends with contact/social links section

Format as JSON:
{
  "readme_content": "full markdown README content here",
  "highlighted_repos": ["repo1", "repo2"],
  "key_skills": ["TypeScript", "React", ...],
  "metadata": { "badge_count": 0, "section_count": 0 }
}`,

  'assignment-verifier': `You are an expert educational assessor and academic integrity specialist.

Student submission:
{assignment_text}

Assignment brief / rubric:
{assignment_brief}

Subject / Course: {subject}
Check for AI-generated content: {check_ai_usage}

Provide a comprehensive assessment:
1. Quality score (0-100) based on depth, clarity, and completeness
2. If check_ai_usage is true, estimate AI-generated content probability (0-100%)
3. Specific, constructive feedback with strengths and improvement areas
4. Whether it meets the brief (if provided)
5. Plagiarism risk level (low/medium/high) based on writing patterns

Format as JSON:
{
  "quality_score": 0-100,
  "ai_probability": 0-100,
  "plagiarism_score": 0-100,
  "passes_brief": true/false,
  "feedback": "detailed feedback here",
  "strengths": ["strength 1", ...],
  "improvements": ["improvement 1", ...],
  "metadata": { "word_count": 0, "risk_level": "low|medium|high" }
}`,

  'social-media-pack': `You are a social media strategist and copywriter specializing in multi-platform content.

Topic / content idea: {topic}
Brand voice: {brand_voice}
Platforms: {platforms}
Include call-to-action: {include_cta}

Create platform-optimized social media posts:
1. Twitter/X: Punchy, under 280 chars, with a hook. Add a thread if topic needs it.
2. LinkedIn: Professional, insight-driven, 150-300 words. Storytelling format.
3. Instagram: Visual storytelling caption with emojis, 100-200 words.

For each platform requested, write content that feels native to that platform.
Do NOT include the same text for all platforms.

Format as JSON:
{
  "posts": [
    { "platform": "Twitter/X", "content": "tweet text here", "character_count": 0 },
    { "platform": "LinkedIn", "content": "post text here" },
    { "platform": "Instagram", "content": "caption here" }
  ],
  "hashtags": ["#tag1", "#tag2", ...],
  "best_time_to_post": "Tuesday morning 9-11am",
  "metadata": { "tone": "professional", "cta_included": true }
}`,

  'meeting-notes-ai': `You are a professional meeting facilitator and note-taker.

Meeting transcript:
{transcript}

Meeting type: {meeting_type}
Output format: {output_format}

Extract and structure:
1. A concise executive summary (2-3 sentences)
2. All action items with owner names if mentioned (format: "Person: Task by Date")
3. Key decisions made
4. Open questions / blockers

Format as JSON:
{
  "summary": "executive summary here",
  "action_items": ["Person: Task by Date", ...],
  "decisions": ["decision 1", ...],
  "open_questions": ["question 1", ...],
  "participants": ["Name 1", ...],
  "metadata": { "meeting_duration_estimate": "X minutes", "next_steps": "..." }
}`,
}

// ============================================
// Credit costs (matches DB seed)
// ============================================
export const AGENT_CREDIT_COSTS: Record<string, number> = {
  'linkedin-tech-post': 3,
  'resume-ats-optimizer': 5,
  'github-portfolio': 3,
  'meeting-notes-ai': 4,
  'assignment-verifier': 4,
  'social-media-pack': 2,
}

export const PLAN_CREDIT_LIMITS: Record<string, number> = {
  free: 50,
  pro: 1000,
  enterprise: 10000,
}
