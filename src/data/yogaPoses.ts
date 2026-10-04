export interface YogaPose {
  id: string;
  englishName: string;
  sanskritName: string;
  sanskritScript?: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'All Levels' | 'Advanced';
  targetFocus: string;
  duration: string;
  imageUrl: string;
  instructions: string[];
  keyBenefits: string[];
  precautions: string[];
  source: {
    name: string;
    url: string;
    authority: string;
  };
}

export const DAILY_YOGA_POSES: YogaPose[] = [
  {
    id: 'tree-pose',
    englishName: 'Tree Pose',
    sanskritName: 'Vrikshasana',
    sanskritScript: 'वृक्षासन',
    category: 'Standing Balance & Grounding',
    level: 'Beginner',
    targetFocus: 'Ankles, Core, Postural Stability & Focus',
    duration: '30–60 seconds per side',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    instructions: [
      'Stand tall in Mountain Pose (Tadasana) with feet hip-width apart and arms relaxed at your sides.',
      'Shift your body weight onto your left foot, pressing firmly into the heel and toes.',
      'Bend your right knee, turning it slightly outward, and place the sole of your right foot against your inner left calf or inner left thigh (never directly against the knee joint).',
      'Bring your hands together in prayer position (Anjali Mudra) at your heart center or reach them overhead with shoulders relaxed.',
      'Fix your gaze on an unmoving spot ahead (Drishti), breathe deeply for 30–60 seconds, then slowly lower your foot and repeat on the opposite side.'
    ],
    keyBenefits: [
      'Strengthens calves, ankles, thighs, and spinal erector muscles.',
      'Tones the deep abdominal core and promotes neurological balance.',
      'Sharpen mental focus, concentration, and body-space awareness (proprioception).',
      'Helps relieve mild stress and encourages centered, calm breathing.'
    ],
    precautions: [
      'Avoid placing your foot directly against the side of the knee joint to prevent lateral ligament strain.',
      'If balance is unsteady, practice with your back against a wall or gently rest one hand on a sturdy chair.',
      'Individuals with acute knee or ankle injuries should keep the toes of the lifted foot lightly resting on the floor.',
      'If you have high blood pressure, keep your palms resting together at your chest rather than extended overhead.'
    ],
    source: {
      name: 'Yoga Journal Anatomy & National Institutes of Health (NIH)',
      url: 'https://www.yogajournal.com/poses/tree-pose',
      authority: 'Yoga Journal & NCCIH Clinical Wellness Guidelines'
    }
  },
  {
    id: 'warrior-2',
    englishName: 'Warrior II',
    sanskritName: 'Virabhadrasana II',
    sanskritScript: 'वीरभद्रासन II',
    category: 'Standing Strength & Hip Opening',
    level: 'Beginner',
    targetFocus: 'Quadriceps, Glutes, Chest & Respiratory Capacity',
    duration: '30–60 seconds per side',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
    instructions: [
      'Step your feet wide apart (approx. 3.5 to 4 feet). Turn your right foot out 90 degrees and pivot your left foot slightly inward (about 15 degrees).',
      'Inhale and raise your arms parallel to the floor, reaching actively outward from the shoulders with palms facing down.',
      'Exhale and bend your right knee directly over your right ankle until your right thigh is nearly parallel to the mat.',
      'Keep your torso vertically upright, centered directly over your hips, and gaze softly over your right middle fingernail.',
      'Anchor firmly into the outer blade of your back foot. Hold for 30–60 seconds, straighten your front leg, and switch to the left side.'
    ],
    keyBenefits: [
      'Builds muscular endurance, strength, and stamina in legs, glutes, and core.',
      'Opens the groin, hips, chest, and intercostal respiratory muscles.',
      'Stimulates abdominal circulation and supports healthy metabolic digestion.',
      'Cultivates grounded confidence, physical fortitude, and calm emotional resilience.'
    ],
    precautions: [
      'Ensure the front knee tracks directly over your second toe and does not collapse inward toward the midline.',
      'Do not allow the front knee to extend past the ankle joint.',
      'If you experience neck stiffness, keep your gaze centered toward the front of your chest rather than looking over the hand.',
      'Those with chronic hip stiffness should shorten the distance between feet.'
    ],
    source: {
      name: 'Yoga Journal Asana Archive & Light on Yoga',
      url: 'https://www.yogajournal.com/poses/warrior-ii-pose',
      authority: 'Yoga Journal Foundation Series'
    }
  },
  {
    id: 'cobra-pose',
    englishName: 'Cobra Pose',
    sanskritName: 'Bhujangasana',
    sanskritScript: 'भुजङ्गासन',
    category: 'Gentle Spinal Extension & Heart Opener',
    level: 'Beginner',
    targetFocus: 'Spine Flexibility, Upper Back, Chest & Digestive Organs',
    duration: '15–30 seconds, 2–3 repetitions',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    instructions: [
      'Lie face down on your mat with legs extended straight behind you, tops of your feet resting flat on the floor.',
      'Place your palms flat on the mat directly beneath your shoulders, drawing your elbows in close to your ribcage.',
      'Firmly press the tops of your feet, thighs, and pelvis into the mat.',
      'On an inhalation, engage your back muscles to gently peel your chest and upper ribs off the floor, using minimal hand pressure.',
      'Keep your shoulders relaxed away from your ears and your neck long. Hold for 15–30 seconds with calm breaths, then slowly lower down on an exhale.'
    ],
    keyBenefits: [
      'Strengthens the spinal erector muscles, shoulder girdle, and gluteals.',
      'Stretches the chest, lungs, and abdomen, counteracting prolonged sitting and screen hunching.',
      'Gently massages abdominal organs, stimulating digestive fire and metabolic flow.',
      'Elevates mood and combats physical and mental fatigue.'
    ],
    precautions: [
      'Avoid hyperextending or pinching the lumbar lower back; focus on lengthening the thoracic upper spine.',
      'Contraindicated during pregnancy or for individuals with recent abdominal surgery or acute disc herniation.',
      'Do not lock or push aggressively through your elbows.',
      'If lower back sensitivity occurs, substitute with Sphinx Pose on forearms.'
    ],
    source: {
      name: 'Yoga Journal Medical Advisory & Sivananda Yoga',
      url: 'https://www.yogajournal.com/poses/cobra-pose',
      authority: 'Yoga Journal Medical Review'
    }
  },
  {
    id: 'downward-dog',
    englishName: 'Downward-Facing Dog',
    sanskritName: 'Adho Mukha Svanasana',
    sanskritScript: 'अधोमुखश्वानासन',
    category: 'Inversion & Full-Body Awakening',
    level: 'Beginner',
    targetFocus: 'Hamstrings, Calves, Shoulders, Spine & Mental Alertness',
    duration: '1–2 minutes (5–8 deep breaths)',
    imageUrl: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=800&q=80',
    instructions: [
      'Start on your hands and knees in tabletop position, with wrists aligned directly under shoulders and knees under hips.',
      'Spread your fingers wide on the mat, tuck your toes, and press firmly into the knuckles of your index fingers and thumbs.',
      'Exhale and lift your knees off the floor, sending your sitting bones upward and back toward the sky to form an inverted "V" shape.',
      'Press your heels gently toward the ground (soft knee bend is recommended if your hamstrings or lower back are tight).',
      'Relax your head between your upper arms, draw your shoulder blades wide across your back, and take 5–8 slow, deep diaphragmatic breaths.'
    ],
    keyBenefits: [
      'Deeply elongates the entire posterior chain: hamstrings, calves, Achilles tendons, and spinal muscles.',
      'Strengthens wrists, arms, upper back, and deep core stabilizers.',
      'Inverts blood flow toward the brain, revitalizing energy and alleviating brain fog.',
      'Known in clinical integrative medicine to relieve tension headaches and back stiffness.'
    ],
    precautions: [
      'If you have tight hamstrings or lower back pain, keep a generous bend in your knees to keep your pelvis tilted and spine straight.',
      'Avoid or modify if suffering from acute carpal tunnel syndrome, uncontrolled high blood pressure, or late-stage pregnancy.',
      'Do not collapse your chest toward the floor; maintain broad, active shoulders.'
    ],
    source: {
      name: 'National Center for Complementary and Integrative Health (NIH)',
      url: 'https://www.yogajournal.com/poses/downward-facing-dog',
      authority: 'NIH Integrative Wellness & Yoga Journal'
    }
  },
  {
    id: 'triangle-pose',
    englishName: 'Extended Triangle Pose',
    sanskritName: 'Utthita Trikonasana',
    sanskritScript: 'उत्थित त्रिकोणासन',
    category: 'Standing Lateral Extension & Balance',
    level: 'Beginner to Intermediate',
    targetFocus: 'Hips, Hamstrings, Groin, Torso Obliques & Lung Expansion',
    duration: '30–60 seconds per side',
    imageUrl: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=800&q=80',
    instructions: [
      'Stand with your feet approximately 3.5 to 4 feet apart. Turn your right foot out 90 degrees and pivot your left foot in 15 degrees.',
      'Inhale and reach your arms straight out to the sides at shoulder height, palms down.',
      'Exhale and hinge deeply at the right hip crease, extending your right arm and torso forward over your right leg.',
      'Lower your right hand to your shin, ankle, or a yoga block outside the foot, and extend your left arm vertically toward the ceiling.',
      'Turn your head to look softly up at your top hand (or look forward if your neck is sensitive). Hold for 30–60 seconds, inhale to rise, and repeat on the other side.'
    ],
    keyBenefits: [
      'Stretches and strengthens thighs, knees, hamstrings, hips, and calves.',
      'Opens the chest, shoulders, and lateral ribcage, increasing lung oxygenation.',
      'Stimulates abdominal organs, enhancing peristalsis and digestion.',
      'Helps alleviate stress, lower back stiffness, and sciatica symptoms.'
    ],
    precautions: [
      'Never press your lower hand directly against the knee joint to avoid hyperextension.',
      'Keep your chest open; avoid letting your torso roll forward toward the ground.',
      'If you have cervical neck issues, look straight ahead or down at your front foot rather than looking up.',
      'Individuals with low blood pressure should exit the pose slowly to avoid dizziness.'
    ],
    source: {
      name: 'Iyengar Yoga Institute & Yoga Journal',
      url: 'https://www.yogajournal.com/poses/extended-triangle-pose',
      authority: 'B.K.S. Iyengar Classical Posture Standards'
    }
  },
  {
    id: 'bridge-pose',
    englishName: 'Bridge Pose',
    sanskritName: 'Setu Bandha Sarvangasana',
    sanskritScript: 'सेतुबन्धसर्वाङ्गासन',
    category: 'Gentle Backbend & Front Body Opening',
    level: 'Beginner',
    targetFocus: 'Glutes, Spine, Hip Flexors, Thyroid & Chest',
    duration: '30–60 seconds, 2–3 repetitions',
    imageUrl: 'https://images.unsplash.com/photo-1599447292180-45fd84092dd4?auto=format&fit=crop&w=800&q=80',
    instructions: [
      'Lie flat on your back with knees bent and feet flat on the floor, hip-width apart and parallel, close enough that your fingertips graze your heels.',
      'Keep arms alongside your torso, palms pressing downward into the mat.',
      'Press firmly into your feet and arms. On an inhale, lift your hips and lower back upward toward the ceiling.',
      'Roll your shoulders underneath you and interlace your fingers beneath your pelvis, pressing knuckles toward your heels to broaden the collarbones.',
      'Keep thighs parallel and knees stacked over ankles. Hold for 30–60 seconds breathing smoothly, then unlace fingers and slowly roll your spine down on an exhale.'
    ],
    keyBenefits: [
      'Stretches the chest, neck, spine, and anterior hip flexor muscles.',
      'Strengthens the glutes, hamstrings, and lower spinal stabilizers.',
      'Stimulates thyroid function, endocrine balance, and abdominal digestion.',
      'Known to calm the nervous system, alleviate mild fatigue, and ease anxiety.'
    ],
    precautions: [
      'DO NOT turn your head from side to side while hips are elevated to protect delicate cervical vertebrae.',
      'Avoid squeezing the knees outward or inward; keep thighs strictly parallel.',
      'Individuals with acute neck or lower back injuries should place a supportive yoga block under the sacrum for Supported Bridge Pose.',
      'Avoid high bridge lifting during third trimester of pregnancy.'
    ],
    source: {
      name: 'Harvard Health Publishing & Yoga Journal',
      url: 'https://www.yogajournal.com/poses/bridge-pose',
      authority: 'Harvard Medical School Mind-Body Guidelines'
    }
  },
  {
    id: 'childs-pose',
    englishName: 'Child’s Pose',
    sanskritName: 'Balasana',
    sanskritScript: 'बालासन',
    category: 'Restorative & Deep Parasympathetic Relaxation',
    level: 'All Levels',
    targetFocus: 'Spine Decompression, Hips, Calming Nervous System',
    duration: '1–3 minutes of conscious breathing',
    imageUrl: 'https://images.unsplash.com/photo-1552196563-55236817b1bf?auto=format&fit=crop&w=800&q=80',
    instructions: [
      'Kneel on the floor with your big toes touching and knees separated comfortably (about mat-width apart).',
      'Exhale and fold forward from your hips, lowering your torso down between your thighs.',
      'Rest your forehead gently on the mat (or on a folded blanket or block for extra comfort).',
      'Extend your arms out long in front of you with palms facing down, or rest them alongside your torso with palms facing up.',
      'Surrender your weight into the mat, feeling your back ribs expand with every inhale. Hold for 1 to 3 minutes.'
    ],
    keyBenefits: [
      'Gently stretches the hips, thighs, ankles, and lumbar spine.',
      'Activates the parasympathetic (rest and digest) nervous system, dropping stress and cortisol levels.',
      'Releases chronic tension in the neck, shoulders, and lower back.',
      'Encourages mindful, conscious diaphragmatic breathing and deep mental stillness.'
    ],
    precautions: [
      'Place a rolled blanket under your ankles or behind your knees if you experience joint discomfort or tightness.',
      'Pregnant women should keep knees wide apart to avoid pressing into the abdomen.',
      'Avoid or modify if experiencing acute diarrhea or recent knee ligament injury.',
      'If your forehead does not comfortably reach the mat, rest it on a yoga block or stacked fists to avoid neck craning.'
    ],
    source: {
      name: 'Mayo Clinic Integrative Medicine & Yoga Journal',
      url: 'https://www.yogajournal.com/poses/childs-pose',
      authority: 'Mayo Clinic Healthy Lifestyle Guidelines'
    }
  }
];

/**
 * Returns today's curated Yoga Pose based on the day of the week or date.
 * Guarantees a fresh, authentic pose for every day of the week.
 */
export function getDailyYogaPose(dateInput?: Date | string): YogaPose {
  const targetDate = dateInput 
    ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) 
    : new Date();
  
  const dayIndex = targetDate.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  return DAILY_YOGA_POSES[dayIndex % DAILY_YOGA_POSES.length];
}
