import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

const users = [
    {
        name: "Elon Musk",
        email: "elon@x.com",
        image: "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQU2JRbbl3LBOm_an3eI5iplFhOoLESyBwUfmWDO49BS1EYuGUE",
        banner: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=1200&q=80",
        bio: "X, SpaceX, Tesla, Neuralink, The Boring Company. In that order.",
    },
    {
        name: "Sam Altman",
        email: "sam@openai.com",
        image: "https://avatars.githubusercontent.com/u/702459",
        banner: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80",
        bio: "CEO of OpenAI. Trying to make AGI go well for humanity.",
    },
    {
        name: "Andrej Karpathy",
        email: "andrej@tesla.com",
        image: "https://avatars.githubusercontent.com/u/241138",
        banner: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80",
        bio: "AI researcher. ex-Tesla, ex-OpenAI. I like neural networks.",
    },
    {
        name: "Linus Torvalds",
        email: "linus@linux.org",
        image: "https://avatars.githubusercontent.com/u/1024025",
        banner: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=1200&q=80",
        bio: "I created Linux and Git. Talk is cheap. Show me the code.",
    },
    {
        name: "Pieter Levels",
        email: "pieter@levels.io",
        image: "https://avatars.githubusercontent.com/u/751781",
        banner: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=1200&q=80",
        bio: "Building 12 startups in 12 months. Nomad. Maker.",
    },
    {
        name: "Sara Techie",
        email: "sara@dev.io",
        image: "https://randomuser.me/api/portraits/women/44.jpg",
        banner: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80",
        bio: "Full-stack dev 🚀 | Open source | Coffee addict",
    },
];

const posts = [
    // Elon
    "The thing I find most surprising is how few people actually ship things.",
    "If you're not embarrassed by your first version, you launched too late.",
    "Free speech is the foundation of a functioning democracy.",
    "X is the everything app. We're just getting started.",
    "Working 80 hours a week is not for everyone. But it's the only way I know.",

    // Sam
    "GPT-5 is going to be a significant leap. We are very excited.",
    "The best time to start working on AI safety was 10 years ago. The second best time is now.",
    "I genuinely think we are building one of the most transformative technologies in human history.",
    "Most startups fail because they build something nobody wants. Talk to users.",
    "Compute is the new oil. Whoever controls it shapes the future.",

    // Andrej
    "Neural networks are just matrix multiplications with a sprinkle of magic.",
    "The best way to understand backpropagation is to implement it yourself.",
    "PyTorch > TensorFlow. I said what I said.",
    "LLMs are not stochastic parrots. They are compression of human knowledge.",
    "Don't use frameworks when you're learning. Write everything from scratch first.",

    // Linus
    "Bad programmers worry about the code. Good programmers worry about data structures.",
    "An OS is not something you build. It's something that grows.",
    "I don't trust code I didn't write. Including my own from 5 years ago.",
    "Git was born out of frustration. Most good software is.",
    "C is the right tool for the job. The job is almost everything.",

    // Pieter
    "Just launched my 7th startup. Revenue on day 1: $12. I'll take it.",
    "Stop planning. Start building. The market will tell you if you're right.",
    "Working from a café in Bali right now. 3 paying customers. Life is good.",
    "Bootstrapped > VC-funded. Change my mind.",
    "Idea: 10%. Execution: 90%. Timing: also 90%. Yes the math is off. That's startups.",

    // Sara
    "Just refactored 3000 lines of spaghetti code into something beautiful. This is why I code.",
    "Tabs vs spaces debate is just a distraction from the real issue: naming variables.",
    "Open source is the closest thing to magic. Strangers building things together for free.",
    "My terminal is my happy place.",
    "10 years of coding and I still Google how to reverse a string. No shame.",
];

const comments = [
    "This is so true.",
    "Completely agree!",
    "Hard disagree tbh 😅",
    "This aged well.",
    "Underrated take.",
    "Finally someone said it.",
    "🔥🔥🔥",
    "Can you elaborate?",
    "I needed to hear this today.",
    "Saving this post.",
];

async function main() {
    console.log("🌱 Seeding database...");

    // Slett eksisterende seed-data
    await prisma.notification.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.repost.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: users.map((u) => u.email) } } });

    // Opprett brukere
    const createdUsers = await Promise.all(
        users.map((u) =>
            prisma.user.create({
                data: {
                    name: u.name,
                    email: u.email,
                    image: u.image,
                    banner: u.banner,
                    bio: u.bio,
                },
            })
        )
    );
    console.log(`✅ Created ${createdUsers.length} users`);

    // Opprett poster (5 per bruker)
    const createdPosts = await Promise.all(
        createdUsers.flatMap((user, userIdx) =>
            posts.slice(userIdx * 5, userIdx * 5 + 5).map((content, i) =>
                prisma.post.create({
                    data: {
                        content,
                        authorId: user.id,
                        // Spre postene ut i tid
                        createdAt: new Date(Date.now() - (createdUsers.length * 5 - (userIdx * 5 + i)) * 3600000),
                    },
                })
            )
        )
    );
    console.log(`✅ Created ${createdPosts.length} posts`);

    // Follows: alle følger alle andre
    const followPairs = createdUsers.flatMap((follower) =>
        createdUsers
            .filter((u) => u.id !== follower.id)
            .map((followed) => ({
                followingId: follower.id,
                followedId: followed.id,
            }))
    );
    await prisma.follow.createMany({ data: followPairs });
    console.log(`✅ Created ${followPairs.length} follows`);

    // Likes: hvert post får 2–6 tilfeldige likes
    const likePairs: { postId: string; userId: string }[] = [];
    for (const post of createdPosts) {
        const shuffled = [...createdUsers].sort(() => Math.random() - 0.5);
        const likers = shuffled.slice(0, Math.floor(Math.random() * 5) + 2);
        for (const liker of likers) {
            if (liker.id !== post.authorId) {
                likePairs.push({ postId: post.id, userId: liker.id });
            }
        }
    }
    await prisma.like.createMany({ data: likePairs, skipDuplicates: true });
    console.log(`✅ Created ${likePairs.length} likes`);

    // Reposts: noen poster blir repostet
    const repostPairs: { postId: string; userId: string }[] = [];
    for (const post of createdPosts.slice(0, 15)) {
        const reposter = createdUsers.find((u) => u.id !== post.authorId);
        if (reposter) repostPairs.push({ postId: post.id, userId: reposter.id });
    }
    await prisma.repost.createMany({ data: repostPairs, skipDuplicates: true });
    console.log(`✅ Created ${repostPairs.length} reposts`);

    // Kommentarer: tilfeldige kommentarer på halvparten av postene
    const commentData = createdPosts.slice(0, 20).map((post, i) => ({
        content: comments[i % comments.length],
        postId: post.id,
        authorId: createdUsers[(i + 1) % createdUsers.length].id,
    }));
    await prisma.comment.createMany({ data: commentData });
    console.log(`✅ Created ${commentData.length} comments`);

    console.log("\n🎉 Seeding complete!");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
