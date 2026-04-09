// @ts-nocheck
import mongoose from "mongoose";
import { User } from "../modules/users/user.model";
import { Organization } from "../modules/users/organization.model";
import { Song } from "../modules/songs/song.model";

async function seed() {
  try {
    const uri =
      "mongodb+srv://kayyadams360_db_user:V4e9BhRfLKHL12h4@qworship.bki11v4.mongodb.net/";
    console.log(`Connecting to DB: ${uri}`);
    await mongoose.connect(uri);

    // 1. Find or create User
    let user = await User.findOne({ email: "admin@example.com" });
    if (!user) {
      console.log("Creating mock admin user...");
      user = await User.create({
        username: "admin_seed",
        email: "admin@example.com",
        passwordHash: "hashed_password_mock",
        role: "superadmin",
        accountType: "free",
        isActive: true,
      });
    }

    // 2. Find or create Organization
    let org = await Organization.findOne({ owner: user._id });
    if (!org) {
      console.log("Creating mock organization...");
      org = await Organization.create({
        name: "Demo Church",
        subscriptionType: "free",
        subscriptionStatus: "active",
        owner: user._id,
      });
      // Link back to user
      user.organizations.push(org._id as any);
      await user.save();
    }

    // 3. Clear existing songs for clean slate (optional but good for testing)
    await Song.deleteMany({
      title: { $in: ["Amazing Grace", "How Great Thou Art"] },
    });

    // 4. Create Songs bridging legacy fields and new schema
    console.log("Seeding songs...");

    await Song.create({
      title: "Amazing Grace",
      artist: "John Newton",
      lyrics:
        "[Verse 1]\nAmazing grace how sweet the sound\nThat saved a wretch like me\nI once was lost but now am found\nWas blind but now I see\n\n[Chorus]\nMy chains are gone, I've been set free\nMy God, my Savior has ransomed me",
      structure: ["V1", "C1"],
      ccliNumber: "4759662",
      tags: ["hymn", "grace", "classic"],
      sections: [
        {
          type: "verse",
          title: "Verse 1",
          content:
            "Amazing grace how sweet the sound\nThat saved a wretch like me\nI once was lost but now am found\nWas blind but now I see",
          order: 1,
        },
        {
          type: "chorus",
          title: "Chorus",
          content:
            "My chains are gone, I've been set free\nMy God, my Savior has ransomed me",
          order: 2,
        },
      ],
      organizationId: org._id,
      createdBy: user._id,
    });

    await Song.create({
      title: "How Great Thou Art",
      artist: "Carl Boberg",
      lyrics:
        "[Verse 1]\nO Lord my God, When I in awesome wonder\nConsider all the worlds Thy Hands have made\n\n[Chorus]\nThen sings my soul, My Saviour God, to Thee\nHow great Thou art, How great Thou art",
      structure: ["V1", "C1"],
      ccliNumber: "14181",
      tags: ["worship", "god", "greatness"],
      sections: [
        {
          type: "verse",
          title: "Verse 1",
          content:
            "O Lord my God, When I in awesome wonder\nConsider all the worlds Thy Hands have made",
          order: 1,
        },
        {
          type: "chorus",
          title: "Chorus 1",
          content:
            "Then sings my soul, My Saviour God, to Thee\nHow great Thou art, How great Thou art",
          order: 2,
        },
      ],
      organizationId: org._id,
      createdBy: user._id,
    });

    console.log("✅ Successfully seeded Legacy Songs into new MongoDB Schema!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed DB:", err);
    process.exit(1);
  }
}

seed();
