import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Demo students data
    const demoStudents = [
      { email: 'amina.mohamed@demo.com', name: 'Amina Mohamed', grade: 'Grade 4' },
      { email: 'james.kamau@demo.com', name: 'James Kamau', grade: 'Grade 5' },
      { email: 'faith.wanjiru@demo.com', name: 'Faith Wanjiru', grade: 'Grade 6' },
      { email: 'brian.ochieng@demo.com', name: 'Brian Ochieng', grade: 'Grade 7' },
      { email: 'grace.muthoni@demo.com', name: 'Grace Muthoni', grade: 'Grade 4' },
      { email: 'david.kimani@demo.com', name: 'David Kimani', grade: 'Grade 5' },
      { email: 'mercy.akinyi@demo.com', name: 'Mercy Akinyi', grade: 'Grade 6' },
      { email: 'peter.mwangi@demo.com', name: 'Peter Mwangi', grade: 'Grade 7' },
    ];

    const subjects = ['Mathematics', 'Science & Technology', 'English', 'Kiswahili', 'Social Studies'];
    const skillCodes = [
      'math.arithmetic.addition', 'math.arithmetic.subtraction', 'math.geometry.shapes',
      'science.living.animals', 'science.physical.matter', 'science.earth.water-cycle',
      'english.reading.comprehension', 'english.writing.composition', 'english.grammar.punctuation',
      'kiswahili.kusoma', 'kiswahili.kuandika', 'kiswahili.sarufi',
      'social.kenya.geography', 'social.kenya.history', 'social.economics'
    ];

    const createdUsers = [];

    // Create demo users
    for (const student of demoStudents) {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
          email: student.email,
          password: 'Demo123!',
          email_confirm: true,
          user_metadata: {
            display_name: student.name
          }
        });

        if (userError) {
          console.log(`User might exist: ${student.email}`);
          // Try to get existing user
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(u => u.email === student.email);
          if (existingUser) {
            createdUsers.push({ ...student, userId: existingUser.id });
          }
          continue;
        }

        if (userData.user) {
          createdUsers.push({ ...student, userId: userData.user.id });
        }
      } catch (e) {
        console.error(`Error creating user ${student.email}:`, e);
      }
    }

    // Create profiles
    for (const user of createdUsers) {
      await supabase.from('profiles').upsert({
        user_id: user.userId,
        display_name: user.name
      }, { onConflict: 'user_id' });
    }

    // Create progress data
    for (const user of createdUsers) {
      const questionsAsked = Math.floor(Math.random() * 150) + 50;
      const lessonsCompleted = Math.floor(Math.random() * 20) + 5;
      const streak = Math.floor(Math.random() * 30);
      const subject = subjects[Math.floor(Math.random() * subjects.length)];

      await supabase.from('progress').upsert({
        user_id: user.userId,
        questions: questionsAsked,
        lessons: lessonsCompleted,
        streak: streak,
        grade: user.grade,
        subject: subject,
        last_active: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        competencies: {
          'problem-solving': Math.random() * 0.4 + 0.6,
          'critical-thinking': Math.random() * 0.4 + 0.5,
          'communication': Math.random() * 0.4 + 0.6,
          'creativity': Math.random() * 0.3 + 0.5
        }
      }, { onConflict: 'user_id' });
    }

    // Create learner skills with varied proficiencies
    for (const user of createdUsers) {
      const numSkills = Math.floor(Math.random() * 8) + 5;
      const selectedSkills = [...skillCodes].sort(() => 0.5 - Math.random()).slice(0, numSkills);

      for (const skillCode of selectedSkills) {
        const proficiency = Math.random() * 0.5 + 0.3; // 0.3 to 0.8
        const daysAgo = Math.floor(Math.random() * 30);
        
        await supabase.from('learner_skills').upsert({
          user_id: user.userId,
          skill_code: skillCode,
          proficiency: proficiency,
          last_practiced_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id,skill_code' });
      }
    }

    // Get sample activities for reports
    const { data: activities } = await supabase
      .from('study_activities')
      .select('id, skill_code, difficulty')
      .limit(20);

    // Create activity reports
    if (activities && activities.length > 0) {
      for (const user of createdUsers) {
        const numReports = Math.floor(Math.random() * 15) + 5;
        
        for (let i = 0; i < numReports; i++) {
          const activity = activities[Math.floor(Math.random() * activities.length)];
          const score = Math.random() * 0.4 + 0.5; // 0.5 to 0.9
          const timeSpent = Math.floor(Math.random() * 300) + 60; // 60-360 seconds
          const daysAgo = Math.floor(Math.random() * 45);
          
          await supabase.from('activity_reports').insert({
            user_id: user.userId,
            activity_id: activity.id,
            score: score,
            time_spent_sec: timeSpent,
            completed_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
            metadata: {
              difficulty: activity.difficulty,
              attempts: Math.floor(Math.random() * 3) + 1
            }
          });
        }
      }
    }

    // Create sample chat history
    const sampleTopics = [
      'Addition and Subtraction',
      'Parts of Plants',
      'Reading Comprehension',
      'Kenya Geography',
      'Water Cycle',
      'Shapes and Angles',
      'Letter Writing',
      'Economic Activities'
    ];

    for (const user of createdUsers) {
      const numChats = Math.floor(Math.random() * 5) + 2;
      
      for (let i = 0; i < numChats; i++) {
        const topic = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        
        await supabase.from('chat_history').insert({
          user_id: user.userId,
          grade: user.grade,
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          messages: [
            { role: 'user', content: `Can you help me learn about ${topic}?` },
            { role: 'assistant', content: `Of course! Let's explore ${topic} together...` }
          ],
          created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${createdUsers.length} demo students with complete learning data`,
        students: createdUsers.map(u => ({ email: u.email, name: u.name }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating demo data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
