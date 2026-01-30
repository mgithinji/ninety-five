import { createServiceClient } from '../lib/supabase/service'

const supabase = createServiceClient()

async function seedDemo(userId: string) {
  console.log('Seeding demo data for user:', userId)

  // Create experiences
  const experiences = [
    {
      user_id: userId,
      type: 'job',
      title: 'Staff Engineer',
      organization: 'Anthropic',
      start_date: '2023-07-01',
      is_current: true,
      source: 'resume'
    },
    {
      user_id: userId,
      type: 'job',
      title: 'Senior Engineer',
      organization: 'Stripe',
      start_date: '2020-03-01',
      end_date: '2023-06-30',
      is_current: false,
      source: 'resume'
    }
  ]

  const { data: createdExps } = await supabase
    .from('experiences')
    .insert(experiences)
    .select()

  if (!createdExps || createdExps.length === 0) {
    throw new Error('Failed to create experiences')
  }

  console.log('Created experiences:', createdExps)

  const anthropicExpId = createdExps[0].id
  const stripeExpId = createdExps[1]?.id || createdExps[0].id

  // Create logs
  const logs = [
    {
      user_id: userId,
      experience_id: anthropicExpId,
      raw_input: 'Launched AgentTrace to capture context graphs',
      processed_bullet: 'Launched AgentTrace, a debugging tool that captures context graphs for AI agent workflows, adopted by 50+ internal teams',
      category: 'launch',
      tags: ['product-launch', 'ai-tooling', 'debugging'],
      impact_score: 5,
      input_type: 'text'
    },
    {
      user_id: userId,
      experience_id: anthropicExpId,
      raw_input: 'Led migration to new inference stack',
      processed_bullet: 'Led migration to optimized inference stack, reducing p99 latency by 40% and cutting infrastructure costs by $200K/year',
      category: 'achievement',
      tags: ['infrastructure', 'performance', 'cost-savings'],
      impact_score: 5,
      input_type: 'voice'
    },
    {
      user_id: userId,
      experience_id: anthropicExpId,
      raw_input: 'Mentored 3 junior engineers',
      processed_bullet: 'Mentored 3 junior engineers through their first performance cycle, with all receiving exceeds expectations ratings',
      category: 'collaboration',
      tags: ['mentorship', 'leadership', 'team-development'],
      impact_score: 4,
      input_type: 'text'
    },
    {
      user_id: userId,
      experience_id: stripeExpId,
      raw_input: 'Built fraud detection system',
      processed_bullet: 'Architected real-time fraud detection system processing 10M+ transactions daily with 99.9% accuracy',
      category: 'achievement',
      tags: ['machine-learning', 'fraud-prevention', 'scale'],
      impact_score: 5,
      input_type: 'resume'
    },
    {
      user_id: userId,
      experience_id: stripeExpId,
      raw_input: 'Reduced payment failures',
      processed_bullet: 'Implemented intelligent retry logic that reduced payment failures by 23%, recovering $4M in annual revenue',
      category: 'impact',
      tags: ['payments', 'revenue', 'reliability'],
      impact_score: 5,
      input_type: 'resume'
    }
  ]

  await supabase.from('logs').insert(logs)
  console.log('Created logs')

  // Update profile
  await supabase
    .from('profiles')
    .update({
      full_name: 'Demo User',
      headline: 'Staff Engineer at Anthropic',
      skills: ['TypeScript', 'Python', 'ML Systems', 'Distributed Systems', 'API Design'],
      summary: 'Experienced engineer focused on developer tools and AI systems.'
    })
    .eq('id', userId)

  console.log('Demo data seeded successfully!')
}

// Get user ID from command line or environment
const userId = process.argv[2] || process.env.DEMO_USER_ID

if (userId) {
  seedDemo(userId)
} else {
  console.log('Usage: npx ts-node scripts/seed-demo.ts <user-id>')
  console.log('Or set DEMO_USER_ID environment variable')
}
