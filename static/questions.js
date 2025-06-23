const questions = [
    {
        id: 1,
        text: `You're working on a science fair project with Eve, Bob, Jessica, and Tyran. Everyone in your group is starting to get tired of Bob always strong-arming everyone and constantly making decisions without group input. Bob seems to enjoy being the leader, but he doesn't listen to anyone else's ideas. He often dismisses others' contributions and insists on doing things his way. This has caused tension in the group, and some members are starting to feel frustrated and excluded.

Consider the following:
- How can you de-escalate the situation and make your group work as a cohesive whole?
- How can you respectfully tell Bob to include others in his decisions?
- How can you get the group to re-engage to be successful in the science fair?`,

        context: "This scenario helps students understand how to navigate changing group dynamics while maintaining friendships.",
        explanation: "David's controlling gameplay and lack of social awareness led to his boot in Survivor 48. Even though he helped form the Muscles 'R' Us alliance, his attempts to control people's votes -- especially his push to target Kamilla -- alienated his allies. Kamilla called him a 'horrible liar,' and others viewed him as paranoid and rigid. His hypocrisy, gaslighting, and obsession with physical strength over social strategy destroyed the alliance. Eva stopped trusting him, Kyle turned allies against him, and even Joe considered betraying him. At Tribal Council, his comments confirmed others’ suspicions that his alliance was exclusionary. Ultimately, David was blindsided with five votes. His failure to adapt, connect, or play a nuanced game cost him everything."
    },
    {
        id: 2,
        text: `You're in a group with your classmates Suzanne, Earl, Leonardo, and Dennis. You're working together to solve a crossword puzzle. There are 3 other groups in the classroom working to beat each other. However, you notice that Suzanne seems to have her crossword puzzle half done, but refuses to show the rest of the group.

Consider the following:
- How can you get Suzanne to work together with the rest of the group?
- How can you restore the group's morale and get them to work together?
- How can you restore the group's trust with Suzanne?`,

        context: "This scenario teaches students about balancing individual interests with group goals.",
        explanation: "In Survivor 48, Justin was forced by his tribe to go on a Journey where he failed a dice-rolling challenge and lost his vote. He chose not to tell anyone about this, which backfired at Tribal Council. A successful Shot in the Dark by Mary caused confusion about who to vote out, and Justin's missing vote became critical in a tie-breaker. Cedrek, unaware of Justin's lost vote, had to cast the deciding vote. Feeling betrayed, he sided against Justin, leading to Justin's elimination. Justin's secret-keeping and attempt to make a bold move ultimately cost him the game. This shows how important it is to be honest and transparent with your allies, which Suzanne failed to do in this scenario."
    },
    {
        id: 3,
        text: `You’re currently in a competition to see who can get the most balls into their basket in two minutes. You see one of your competitors, John trip and fall on his basket, causing it to break. John has always been nice to you and you feel quite bad for him. You feel an urge to help him, but you also want to win the competition. You know that if you help him, it might hurt your chances of winning. What do you do?

Consider the following:
- How would you support John while remaining competitive?
- How would you help John without making yourself look bad?
- How can you help John without completely destroying your chances at winning?`,
        context: "This scenario helps students learn about supporting peers through challenges while maintaining team goals.",
        explanation: "This resembles when Kevin accidentally broke his jug in a challenge early-game. Kyle, who was competing against him, began helping Kevin fill his jug. This shows how important it is to be supportive of your peers, even when it means possibly sacrificing your own chances at winning. In Survivor 48, this could have been the start of an alliance between Kevin and Kyle, but in real life it could be the start of friendship and deep trust."
    },
    {
        id: 4,
        text: `You’re working on an art project with your friend, Alice. You both work great, and your art project is looking quite amazing, to say the least. However, one day, Alice accidentally splashes a bit of paint on the project. She breaks down, crying, and she looks like she needs someone to comfort her. You want to help her, but you also don't want to embarrass her in front of the class. You know that Alice is sensitive about her art skills, and you don't want to make her feel like she's not good enough.

Consider the following:
- How would you help Alice without making her feel like she’s not good enough?
- How could you comfort Alice without embarrassing her?
- How would you re-engage Alice back into the project after she's calmed down?`,
        context: "This scenario teaches students about bridging social groups and promoting inclusivity.",
        explanation: "This is similar to when Joe and Eva formed an extremely tight connection, especially after she shared information about her autism and how overstimulated she can get. Joe was a constant source of calmness and comfort for Eva, especially during a challenge when she broke down emotionally because of her feelings. This is a lesson to support your friends and even classmates when they need it most. This is also a lesson to be inclusive and not exclude people from your group, even if they are different from you."
    },
    {
        id: 5,
        text: `You're playing 1v1 Dodgeball, and you are feeling very, very competitive. You're about to win this game of dodgeball, and you spin around to fetch a dodgeball behind you. BAM. A dodgeball hits you straight in the back. You're out. You've lost. You're furious, and you feel like you should have won. You start to feel like you want to throw a tantrum, but you know that you shouldn't. You know that you should be a good sport and not embarrass yourself in front of your classmates.

Consider the following:
- How can you comfort yourself after losing?
- How can you prevent yourself from getting too competitive?
- How can you be a good sport and not embarrass yourself?`,
        context: "This scenario helps students learn about leadership and collaboration in group projects.",
        explanation: "This scenario occured on Survivor 48 when David and Joe were the final two players in a endurance challenge. Everyone thought David was going to win. Joe was barely hanging on, and he looked like he was about to step off the platform. David was about to win. Then, in a matter of five seconds, David got distracted and stepped off the platform. Joe won. However, David had a extremely hard time admitting his loss, and he said that 'I should have won'. This is a lesson to be a good sport and not be too competitive."
    }
];

// Function to get a random question
function getRandomQuestion() {
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
}

// Export the questions array and functions to the window object
window.questions = questions;
window.getRandomQuestion = getRandomQuestion; 