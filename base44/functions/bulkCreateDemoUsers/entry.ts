import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

const FEMALE_NAMES = [
  'Aria', 'Bella', 'Camila', 'Daisy', 'Elena', 'Fiona', 'Grace', 'Hazel', 'Ivy', 'Jade',
  'Kira', 'Luna', 'Maya', 'Nina', 'Olive', 'Piper', 'Quinn', 'Ruby', 'Sasha', 'Tara',
  'Uma', 'Vera', 'Willow', 'Xena', 'Yara', 'Zara', 'Amber', 'Bree', 'Cora', 'Demi',
  'Esme', 'Flora', 'Gwen', 'Holly', 'Iris', 'Joy', 'Kira', 'Lily', 'Mila', 'Nova',
  'Odette', 'Penny', 'Rosa', 'Stella', 'Tessa', 'Uma', 'Violet', 'Wren', 'Yumi', 'Zoe',
  'Adele', 'Bianca', 'Carla', 'Delia', 'Eve', 'Freya', 'Gia', 'Hope', 'Ines', 'Juno',
  'Kelsey', 'Lara', 'Mira', 'Nadia', 'Opal', 'Pearl', 'Rhea', 'Sage', 'Talia', 'Vela'
];

const MALE_NAMES = [
  'Aaron', 'Blake', 'Caleb', 'Damon', 'Ethan', 'Felix', 'Gavin', 'Henry', 'Ian', 'Jack',
  'Kai', 'Leo', 'Mason', 'Noah', 'Owen', 'Parker', 'Quinn', 'Ryan', 'Sean', 'Tyler',
  'Victor', 'Wade', 'Xavier', 'Yusuf', 'Zane', 'Anderson', 'Bennett', 'Cole', 'Dylan', 'Ellis',
  'Frank', 'Grant', 'Hugo', 'Isaac', 'Jagger', 'Knox', 'Logan', 'Miles', 'Nash', 'Orion',
  'Preston', 'Rhett', 'Silas', 'Theo', 'Ulric', 'Vance', 'Wells', 'Yale', 'Zion', 'Asher',
  'Beck', 'Callum', 'Dane', 'Eli', 'Fisher', 'Gunnar', 'Hayes', 'Ivo', 'Jude', 'Kellan'
];

const CITIES = [
  { city: 'New York', country: 'United States' },
  { city: 'Los Angeles', country: 'United States' },
  { city: 'Chicago', country: 'United States' },
  { city: 'Houston', country: 'United States' },
  { city: 'Phoenix', country: 'United States' },
  { city: 'Miami', country: 'United States' },
  { city: 'Seattle', country: 'United States' },
  { city: 'Denver', country: 'United States' },
  { city: 'Atlanta', country: 'United States' },
  { city: 'Boston', country: 'United States' },
  { city: 'Las Vegas', country: 'United States' },
  { city: 'Portland', country: 'United States' },
  { city: 'Nashville', country: 'United States' },
  { city: 'Austin', country: 'United States' },
  { city: 'San Diego', country: 'United States' },
  { city: 'Dallas', country: 'United States' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'Vancouver', country: 'Canada' },
  { city: 'Montreal', country: 'Canada' },
  { city: 'London', country: 'United Kingdom' },
  { city: 'Manchester', country: 'United Kingdom' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Melbourne', country: 'Australia' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'Munich', country: 'Germany' },
  { city: 'Paris', country: 'France' },
  { city: 'Madrid', country: 'Spain' },
  { city: 'Barcelona', country: 'Spain' },
  { city: 'Rome', country: 'Italy' },
  { city: 'Milan', country: 'Italy' },
  { city: 'Amsterdam', country: 'Netherlands' },
  { city: 'Stockholm', country: 'Sweden' },
  { city: 'Copenhagen', country: 'Denmark' },
  { city: 'Dublin', country: 'Ireland' },
  { city: 'Lisbon', country: 'Portugal' },
  { city: 'Vienna', country: 'Austria' },
  { city: 'Prague', country: 'Czech Republic' },
  { city: 'Warsaw', country: 'Poland' },
  { city: 'Budapest', country: 'Hungary' },
  { city: 'Athens', country: 'Greece' },
  { city: 'Istanbul', country: 'Turkey' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Osaka', country: 'Japan' },
  { city: 'Seoul', country: 'South Korea' },
  { city: 'Bangkok', country: 'Thailand' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Manila', country: 'Philippines' },
  { city: 'Jakarta', country: 'Indonesia' },
  { city: 'Mumbai', country: 'India' },
  { city: 'Delhi', country: 'India' },
];

const BIOS = [
  'Adventurer at heart. Coffee enthusiast and world traveler.',
  'Yoga lover seekingSomeone to share sunsets with.',
  'Foodie exploring the city one restaurant at a time.',
  'Artist and dreamer. Looking for my muse.',
  'Bookworm who loves rainy days and good conversations.',
  'Fitness enthusiast. Gym rat by morning, dancer by night.',
  'Music is my life. Concert junkie and vinyl collector.',
  'Outdoor explorer. Hiking trails and mountain peaks calling my name.',
  'Ambitious career woman with a soft spot for romantic dinners.',
  'Photographer capturing lifes beautiful moments. Join my journey?',
  'Dog mom looking for someone who loves furry friends.',
  'Wine enthusiast and amateur chef. Lets cook together?',
  'Beach lover and sunset chaser. Saltwater runs in my veins.',
  'Creative soul working in design. I see beauty in everything.',
  'Travel addict with a bucket list a mile long. Want to join?',
  'Night owl who loves deep conversations under the stars.',
  'Teacher by day, adventurer by weekend. Seeking a partner in crime.',
  'Minimalist living with maximum joy. Less is more.',
  'Coffee snob and podcast junkie. Lets debate over lattes.',
  'Fitness coach helping others glow. Looking for my own glow up.',
  'Urban explorer finding hidden gems in the city.',
  'Cat lady with a wild side. Meow.',
  'Sushi connoisseur and anime fan. Yes, both.',
  'Plant parent with an ever-growing jungle. Seeking fellow green thumb.',
  'Sunrise chaser and morning person. Early bird gets the worm.',
];

const INTERESTS = [
  'Travel', 'Dancing', 'Photography', 'Fitness', 'Cooking', 'Reading', 'Music', 'Movies',
  'Hiking', 'Beach', 'Gaming', 'Animals', 'Art', 'Yoga', 'Coffee', 'Wine', 'Food',
  'Sports', 'Fashion', 'Beauty', 'Nature', 'Camping', 'Swimming', 'Cycling', 'Running',
  'Meditation', 'Spirituality', 'Volunteering', 'Movies', 'Theater', 'Concerts', 'Festivals'
];

const LOOKING_FOR = ['relationship', 'casual', 'friendship', 'marriage'];

const FEMALE_PHOTOS = [
  'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=600&q=80',
  'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=600&q=80',
  'https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=600&q=80',
  'https://images.unsplash.com/photo-1611042553365-9b101441c135?w=600&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&q=80',
  'https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=600&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=600&q=80',
  'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
  'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&q=80',
  'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=600&q=80',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80',
];

const MALE_PHOTOS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=600&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
  'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=600&q=80',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80',
  'https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=600&q=80',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=600&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80',
  'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=600&q=80',
  'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&q=80',
  'https://images.unsplash.com/photo-1535464986678-9491a664b0f7?w=600&q=80',
  'https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=600&q=80',
  'https://images.unsplash.com/photo-1441786485319-5af0f85408f4?w=600&q=80',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80',
  'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=600&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&q=80',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickSubset(arr, min, max) {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const count = Math.min(body.count || 1000, 5000);
    const genderParam = (body.gender || 'female').toLowerCase(); // 'female', 'male', or 'both'

    if (!['female', 'male', 'both'].includes(genderParam)) {
      return Response.json({ error: 'Invalid gender. Use "female", "male", or "both".' }, { status: 400 });
    }

    // Find the highest existing demo sequence number for each prefix
    const existingDemo = await base44.asServiceRole.entities.MemberProfile.filter(
      { user_id: { $regex: '^demo_' } },
      null,
      1000
    );

    let maxFemaleSeq = 0;
    let maxMaleSeq = 0;
    for (const p of existingDemo) {
      const fMatch = (p.user_id || '').match(/^demo_f(\d+)$/);
      if (fMatch) {
        const num = parseInt(fMatch[1], 10);
        if (num > maxFemaleSeq) maxFemaleSeq = num;
      }
      const mMatch = (p.user_id || '').match(/^demo_m(\d+)$/);
      if (mMatch) {
        const num = parseInt(mMatch[1], 10);
        if (num > maxMaleSeq) maxMaleSeq = num;
      }
    }

    // Determine how many of each gender to create
    let femaleCount = 0;
    let maleCount = 0;
    if (genderParam === 'female') {
      femaleCount = count;
    } else if (genderParam === 'male') {
      maleCount = count;
    } else {
      // 'both' — alternate roughly 50/50
      femaleCount = Math.ceil(count / 2);
      maleCount = count - femaleCount;
    }

    let femaleSeq = maxFemaleSeq + 1;
    let maleSeq = maxMaleSeq + 1;

    const createBatch = (gender, startNumber, batchSize, photoList, nameList) => {
      const batch = [];
      const prefix = gender === 'female' ? 'f' : 'm';
      for (let i = 0; i < batchSize; i++) {
        const seqNum = startNumber + i;
        const city = pick(CITIES);
        const name = pick(nameList);
        const photo = pick(photoList);
        const age = 20 + Math.floor(Math.random() * 25); // 20-44

        batch.push({
          user_id: `demo_${prefix}${seqNum}`,
          display_name: `${name} ${seqNum}`,
          gender: gender,
          age: age,
          date_of_birth: `${2026 - age}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
          location_city: city.city,
          location_country: city.country,
          bio: pick(BIOS),
          photo_1: photo,
          verification_status: 'verified',
          profile_review_status: 'approved',
          profile_complete: true,
          is_active: true,
          is_private: false,
          looking_for: pick(LOOKING_FOR),
          interests: pickSubset(INTERESTS, 2, 6),
          tokens: Math.floor(Math.random() * 50),
          has_purchased_tokens: false,
          browse_count_this_week: 0,
          show_tag_id: false,
        });
      }
      return batch;
    };

    // Generate profiles in batches of 100
    let created = 0;
    const batchSize = 100;

    let femaleRemaining = femaleCount;
    let maleRemaining = maleCount;

    while (femaleRemaining > 0 || maleRemaining > 0) {
      const batchLists = [];

      if (femaleRemaining > 0) {
        const thisBatch = Math.min(batchSize, femaleRemaining);
        batchLists.push({ gender: 'female', count: thisBatch, startSeq: femaleSeq, photos: FEMALE_PHOTOS, names: FEMALE_NAMES });
        femaleSeq += thisBatch;
        femaleRemaining -= thisBatch;
      }

      if (maleRemaining > 0) {
        const thisBatch = Math.min(batchSize, maleRemaining);
        batchLists.push({ gender: 'male', count: thisBatch, startSeq: maleSeq, photos: MALE_PHOTOS, names: MALE_NAMES });
        maleSeq += thisBatch;
        maleRemaining -= thisBatch;
      }

      // Create all gender batches together in one bulkCreate call
      const combinedBatch = [];
      for (const bl of batchLists) {
        combinedBatch.push(...createBatch(bl.gender, bl.startSeq, bl.count, bl.photos, bl.names));
      }
      if (combinedBatch.length > 0) {
        await base44.asServiceRole.entities.MemberProfile.bulkCreate(combinedBatch);
        created += combinedBatch.length;
      }
    }

    return Response.json({
      success: true,
      created: created,
      female_created: femaleCount,
      male_created: maleCount,
      female_starting_sequence: maxFemaleSeq + 1,
      female_ending_sequence: maxFemaleSeq + femaleCount,
      male_starting_sequence: maxMaleSeq + 1,
      male_ending_sequence: maxMaleSeq + maleCount,
      gender: genderParam,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}