export interface ScriptSegment {
  id: string;
  index: number;
  timestampRange: string;
  startTimeStr: string;
  endTimeStr: string;
  startSeconds: number;
  endSeconds: number;
  targetDurationSeconds: number;
  act: string;
  sceneTitle: string;
  pauseNote?: string;
  text: string;
}

function parseTime(mmss: string): number {
  const [m, s] = mmss.split(':').map(Number);
  return m * 60 + s;
}

interface RawSegmentInput {
  range: string;
  act: string;
  sceneTitle: string;
  pauseNote?: string;
  text: string;
}

const RAW_SEGMENTS: RawSegmentInput[] = [
  {
    range: '00:00–00:23',
    act: 'Act I · Double Rebirth',
    sceneTitle: 'Rainy Crosswalk Sacrifice & Awakening',
    text: "After sacrificing his life in the pouring rain to save his former high school deskmate from a speeding car, Lin Ran expects his story to end right there on the crosswalk. After all, the girl he just pushed to safety is Su Qingyan, Yunan High School's untouchable icy campus belle and a future billionaire business goddess. Instead of dying, however, he gasps and jolts awake inside his third-year high school classroom. Looking around in disbelief at the familiar blackboard and his eighteen-year-old classmates, he realizes he has actually been reborn into the past. Turning his head, he spots Su Qingyan sleeping peacefully on her desk right beside him. In his previous life, he was so shy around her that he barely dared to look her way, and even though he just died saving her, he figures nothing will change between them since she isn't the one who regressed.",
  },
  {
    range: '00:23–00:40',
    act: 'Act I · Double Rebirth',
    sceneTitle: 'The Campus Belle Awakens & Embraces Him',
    pauseNote: '00:23–00:25 — brief pause / teacher shout',
    text: 'Suddenly, their homeroom teacher, Mr. Liu, barks from the podium, demanding to know why Lin Ran is staring at Su Qingyan in the middle of class. As the entire room erupts into laughter, the noise stirs Su Qingyan awake. She slowly sits up, rubs her eyes, and turns her head toward Lin Ran. The moment she sees his face, her eyes widen and fill with tears. Before anyone can react, the normally cold campus belle stands up, throws her arms tightly around Lin Ran\'s neck in front of the stunned teacher and gasping students, and sobs, "I finally found you!"',
  },
  {
    range: '00:40–01:03',
    act: 'Act I · Double Rebirth',
    sceneTitle: 'Su Qingyan’s Past-Life Diary Discovery',
    text: 'As it turns out, Lin Ran isn\'t the only one who came back. In the timeline after his death, Su Qingyan stood alone in her room, wiping down an old graduation photo of Senior Class Three until she noticed the quiet boy standing in the back row. As a tear fell onto the glass over Lin Ran\'s face, she realized he was the one who had given his life for her. That night, reading through his old diary by the window, she discovered his secret confession: he had fallen in love with his campus belle deskmate, but because of his shy nature, he could only admire her from afar. Whispering "Coward" with a tearful smile, she hugged his diary to her chest and wished that if she could live one more time, she would be the one to actively pursue him.',
  },
  {
    range: '01:03–01:25',
    act: 'Act I · Double Rebirth',
    sceneTitle: 'Classroom Uproar & Mr. Liu’s Fury',
    text: "Back in the classroom, Su Qingyan clings to Lin Ran, crying in relief that she found him again. Lin Ran is completely bewildered, his mind racing as he wonders why the aloof campus belle is suddenly hugging him on the very first day of his rebirth. Gently holding her by the shoulders to calm her down, he barely has time to process the situation before Mr. Liu slams his hand down on the podium, sending chalk dust flying. Furious, the teacher yells that sleeping in class is bad enough, but now Lin Ran has the audacity to harass his deskmate and make her cry. Panicking as Mr. Liu marches over and points a finger in his face, Lin Ran waves his hands frantically and insists it's all a huge misunderstanding.",
  },
  {
    range: '01:25–01:51',
    act: 'Act I · Double Rebirth',
    sceneTitle: 'The Nightmare Excuse & Playful Tease',
    text: "Before Lin Ran gets into real trouble, Su Qingyan wipes her tears and calmly stands up. In her usual composed voice, she tells Mr. Liu that it isn't Lin Ran's fault at all—she simply had a terrible nightmare while napping and got scared. Hearing the goddess defend him, the other boys in class groan in sheer envy. Mr. Liu's expression instantly melts into a warm, fatherly smile as he tells Qingyan to sit down, only to whip back around and glare ferociously at Lin Ran, warning that he'll skin him alive if he ever bullies her again. Once class resumes, Lin Ran glances sideways at his deskmate, only to catch Su Qingyan giving him a breathtaking smile and playfully licking her lips. Startled out of his wits, Lin Ran yelps out loud, earning another angry scolding from Mr. Liu for not sitting still.",
  },
  {
    range: '01:51–02:17',
    act: 'Act I · Double Rebirth',
    sceneTitle: 'Secret Notes & Calling Her Big Sister',
    text: 'While Lin Ran tries to recover from the scare, Su Qingyan gazes at his side profile with glowing pink hearts in her eyes, thinking to herself how adorably flustered he is and how badly she wants to pinch and knead his cheeks. Yet the second Lin Ran turns his head to check on her, she is sitting primly with an expressionless face, leaving him wondering if he just hallucinated the whole thing. Unable to take the suspense, he tears a corner off his notebook, scribbles a question asking, "Big Sister, what on earth are you trying to do?" and slides it onto her desk. Su Qingyan glances down, picks up her pen, and passes the note back with a cold, textbook reply: "Do not pass notes during class." Lin Ran rolls his eyes in defeat, completely unaware that right beside him, Su Qingyan is gripping her pen with trembling hands, her heart melting inside because he just called her "Big Sister."',
  },
  {
    range: '02:17–02:46',
    act: 'Act II · Breaking Free from the Past',
    sceneTitle: 'Hallway Talk with Best Friend Zhao Ke',
    text: "The moment the bell rings a few minutes later, Lin Ran bolts out of his seat and sprints into the hallway just to catch his breath. Leaning against the railing, he is approached by his best friend, Zhao Ke, who flashes a huge thumbs-up and praises him for managing to score a hug from the untouchable campus belle. Lin Ran sighs wearily and explains that he really didn't have any intentions toward her. Slapping a hand on Lin Ran's shoulder, Zhao Ke says he understands feeling inferior around a girl as famous as Su Qingyan, but since Lin Ran is her deskmate, he has the ultimate home-field advantage. Besides, Zhao Ke adds, even if he fails to win her over, it's nothing to be ashamed of—and it's a thousand times better than continuing to be a pathetic simp for Shen Lingshan. At the mention of that name, Lin Ran's eyes narrow.",
  },
  {
    range: '02:46–03:08',
    act: 'Act II · Breaking Free from the Past',
    sceneTitle: 'Flashback to Shen Lingshan’s Betrayal',
    pauseNote: '02:51–02:55 — brief pause / flashback transition',
    text: "Right on cue, a sweet voice calls out his name from down the corridor, and Shen Lingshan walks over arm-in-arm with her best friend, Cui Qianqian. Just looking at Shen Lingshan's fake smile triggers a painful memory from Lin Ran's previous life. Back then, on a stormy night with lightning splitting the sky, he had stood soaking wet in the pouring rain clutching a bouquet of flowers for her—only to watch a luxury black sedan pull up to the curb, where through the rain-streaked window, he saw Shen Lingshan passionately kissing a wealthy man in the backseat.",
  },
  {
    range: '03:08–03:35',
    act: 'Act II · Breaking Free from the Past',
    sceneTitle: 'The Seven-Minute Ice Cream Demand',
    text: 'Snapping back to the present, Lin Ran listens as Shen Lingshan sweetly tells him that she and Qianqian are craving ice cream, ordering him to run to the school store and buy it for them. Beside her, Cui Qianqian points a finger at his nose and barks at him to hurry up, reminding him there are only seven minutes left of break and he won\'t make it back in time if he doesn\'t start running now. Annoyed on his friend\'s behalf, Zhao Ke steps forward and snaps that since she knows there are only seven minutes left and how far the store is, there\'s no way anyone could make it back before the bell. Shen Lingshan rolls her eyes dismissively at Zhao Ke and coos that just because he can\'t do it doesn\'t mean "our Lin Ran" can\'t, turning to bat her eyelashes at Lin Ran for agreement. Lin Ran stares at her coldly and asks, "Are you sick in the head?"',
  },
  {
    range: '03:35–04:09',
    act: 'Act II · Breaking Free from the Past',
    sceneTitle: '“Good Legs—Run There Yourself!”',
    pauseNote: '03:35–03:37 — brief pause / stunned silence',
    text: 'Both girls freeze as if struck by lightning, their jaws dropping in disbelief. With a completely deadpan face, Lin Ran adds that if she isn\'t sick, she can just walk over and buy it herself. Recovering from her shock, Shen Lingshan puts on a pitiful pout and whines that she\'s too tired to run, while Cui Qianqian angrily scolds Lin Ran for being so heartless toward a delicate girl with such slender arms and legs. Hearing that, Lin Ran slowly lowers his gaze to Shen Lingshan\'s legs, nods approvingly, and smiles: "Good legs." Assuming he has fallen right back under her spell, Shen Lingshan blushes, smooths down her skirt shyly, and asks if that means he agrees to go. Instead, Lin Ran clenches his fist encouragingly and says, "With legs that good, you must run super fast! Believe in yourself, you can do it!"',
  },
  {
    range: '04:09–04:40',
    act: 'Act II · Breaking Free from the Past',
    sceneTitle: 'Exposing the Lunch Money Freeloader',
    text: 'Shen Lingshan\'s smile cracks completely. Losing her patience, Cui Qianqian crosses her arms and demands to know if he\'s going or not since there are only five minutes left. Taking a deep breath to maintain her manipulative "green tea" act, Shen Lingshan forces a sweet smile and tells Lin Ran that if he buys the ice cream for them right now, she\'ll reluctantly reward him by eating lunch with him today. Lin Ran\'s eyes widen in pure outrage as he points right at her face and shouts, "You even want to freeload my lunch money?!" Inwardly, he scoffs at her audacity—she already ruined him enough in his past life, and she thinks she can make him her simp again in this one? Pushed to the brink, Shen Lingshan stomps her foot, her face turning beet red as she stammers, "If you don\'t go, I\'ll... I\'ll...!"',
  },
  {
    range: '04:40–05:14',
    act: 'Act II · Breaking Free from the Past',
    sceneTitle: 'Canceling the Hand-Holding Promise',
    text: 'Seeing her struggle to finish the sentence, Zhao Ke laughs and mocks her for not even being able to come up with a threat, pointing out that Lin Ran does all her exhausting errands without ever getting a single benefit, so she has nothing to hold over him. Suddenly, a lightbulb goes off in Shen Lingshan\'s head. Raising her chin triumphantly, she declares that if he doesn\'t go right now, her previous promise to consider holding hands with him is officially canceled, and he will never get another chance! Hearing those words, Lin Ran freezes, his eyes widening as tears of pure joy well up. They haven\'t held hands yet! That means in this timeline, his body is still completely clean and unstained! Overwhelmed with gratitude, he clasps his hands and bows ninety degrees, choked up as he says, "Thank you so much!" Misinterpreting his bow as panic, Lingshan smugly tells him to hurry up and buy her a Magnum ice cream bar.',
  },
  {
    range: '05:14–05:46',
    act: 'Act II · Breaking Free from the Past',
    sceneTitle: 'Su Qingyan Steps Into the Hallway',
    text: 'Straightening up with a radiant grin, Lin Ran replies, "Don\'t worry, I\'m definitely not going!" Shen Lingshan\'s face twists in fury as she screams asking if he heard her clearly—if he doesn\'t go, she will never hold his hand! Lin Ran enthusiastically shouts back, "It\'s a deal! No take-backs! You promised we won\'t hold hands for the rest of our lives!" Beside herself with rage, Cui Qianqian screeches at the top of her lungs, asking if Lin Ran even understands human speech. Her shouting draws a crowd of students in the hallway, who whisper pityingly that Lin Ran must have lost his mind after having his heart broken. Just then, the door to Class Three slides open, and a cold, clear voice cuts through the noise: "Of course he understands." Stepping into the hallway, Su Qingyan walks straight past the onlookers and stands protectively in front of Lin Ran.',
  },
  {
    range: '05:46–06:16',
    act: 'Act II · Breaking Free from the Past',
    sceneTitle: 'The Campus Belle Defends Her Man',
    text: 'As the breeze catches her long black hair, Lin Ran stares in shock at her back. Turning her icy blue eyes on Shen Lingshan and Cui Qianqian, Su Qingyan calmly asks, "On the other hand, is it the two of you who don\'t understand human speech?" The surrounding students gasp in disbelief, amazed that the aloof campus belle is actually stepping up to defend Lin Ran. Without giving Shen Lingshan a chance to recover, Su Qingyan states that Lin Ran already made it clear he isn\'t interested, asking if she isn\'t embarrassed to keep pestering him so shamelessly. While her outward expression remains frostily composed, inwardly Su Qingyan\'s eyes narrow with fierce possessiveness: "How dare someone like you touch the man I have my eyes on?" Flustered and intimidated, Shen Lingshan and Cui Qianqian demand to know what relationship Su Qingyan even has with Lin Ran to be meddling in their conversation.',
  },
  {
    range: '06:16–06:48',
    act: 'Act II · Breaking Free from the Past',
    sceneTitle: '“I’m His Deskmate—What About You?”',
    text: 'Inside her head, Su Qingyan is practically roaring at them: he willingly got hit by a car to save her life, and in the future she already knelt down, kowtowed to his parents, and called them Mom and Dad—what kind of relationship do they think they have?! Out loud, however, she maintains her cool facade and simply says, "I\'m his deskmate." Behind her, both Lin Ran and Zhao Ke nearly trip over themselves at such an anticlimactic answer. Feeling bold again, Cui Qianqian scoffs and says she thought it was something impressive, but they\'re just deskmates. Su Qingyan\'s lips curve into a chilling smile as she steps closer and asks Shen Lingshan, "Then what about you? What is your relationship with Lin Ran?" Cornered, Lingshan stammers that they are "good friends," and Qianqian quickly adds, "The kind of good friends who have a chance to hold hands!" Su Qingyan chuckles mockingly, asking what kind of good friend makes someone run errands just for a chance to hold hands.',
  },
  {
    range: '06:48–07:22',
    act: 'Act II · Breaking Free from the Past',
    sceneTitle: '“Hold My Hand—No Errands, It’s Free”',
    text: 'Turning to face Lin Ran, Su Qingyan tells him in a firm voice to keep his eyes open when choosing friends from now on, and to stay away from shady girls who only care about taking advantage of others. Then, looking straight into his eyes with a soft blush on her cheeks, she adds, "Besides, if you really want to hold a girl\'s hand... hold mine. No errands required. It\'s free." The entire hallway goes dead silent, their eyes wide with shock. Before Lin Ran can even process what she just said, Su Qingyan reaches out her slender hand and clasps his right in front of everyone. Looking down at their joined hands, Lin Ran\'s mind goes blank, only registering how cool and soft her skin feels. As the warning bell chimes, she calmly tells him class is starting and leads him down the corridor hand-in-hand, leaving Zhao Ke screaming at the top of his lungs in pure admiration.',
  },
  {
    range: '07:22–07:59',
    act: 'Act III · Classroom Hand-Holding & Notes',
    sceneTitle: 'Victory Confetti Behind an Icy Facade',
    text: "Even after they return to their seats in the classroom, Su Qingyan continues holding Lin Ran's hand right on top of the desk while their classmates stare in disbelief. Awkwardly clearing his throat, Lin Ran tries to say something, but she cuts him off while looking toward the window, telling him not to get the wrong idea—she simply couldn't stand watching those two girls take advantage of him, so holding hands for a moment is nothing to take to heart. Inside her mind, however, virtual confetti is exploding everywhere as she cheers in triumph: she successfully intercepted little Lin Ran's first hand-hold of this life, and that scheming green tea girl's dirty hands can get lost! Still keeping her cool expression, she adds out loud that her offer to let him hold her hand casually was just a figure of speech—while inwardly screaming that he MUST take it seriously and can hold her hand as many times as he wants since she owes him her life!",
  },
  {
    range: '07:59–08:38',
    act: 'Act III · Classroom Hand-Holding & Notes',
    sceneTitle: 'Holding Hands Under the Desk',
    text: 'Turning back to him with a composed look, Su Qingyan asks, "Do you have any other questions?" Lin Ran blinks and replies, "Yes." The view drops beneath their desks, revealing that out of sight, Su Qingyan\'s fingers are still tightly intertwined with his. Looking at her helplessly, Lin Ran asks if they can let go of each other\'s hands now. Realizing she\'s still holding on, Su Qingyan\'s eyes widen slightly as she blushes and says, "Oh, sorry, I forgot," slowly slipping her hand away. Turning toward the window, she pouts inwardly that she got caught when her little deskmate\'s hand was so warm and she wanted to hold it a while longer. Watching her reaction, Lin Ran lets out a long, bewildered sigh. As the afternoon history lecture drags on and half the class falls asleep or sneaks snacks, Lin Ran wakes up from a brief nap and decides to test what\'s going on in her head.',
  },
  {
    range: '08:38–09:13',
    act: 'Act III · Classroom Hand-Holding & Notes',
    sceneTitle: 'The Note Trap: “Call Me Big Sister”',
    text: 'Tearing off another small slip of paper, Lin Ran writes a simple "Thank you" for helping him earlier in the hallway and slides it across the desk. Su Qingyan looks down at the note, her expression softening into a gentle smile before she picks up her pen, writes a quick reply, and nudges it back: "How are you going to thank me?" Reading her question, Lin Ran chuckles to himself, thinking that since he literally gave his life for her in his previous timeline, shouldn\'t she be the one figuring out how to thank him? Remembering once again that she has no memories of that, he sighs and writes back: "How do you want me to thank you?" The moment Su Qingyan reads his response, a mischievous, fox-like smile curves across her lips. She scribbles a demand on the paper and slides it right under his hand: "Call me Big Sister and let me hear it."',
  },
  {
    range: '09:13–09:50',
    act: 'Act III · Classroom Hand-Holding & Notes',
    sceneTitle: 'Outsmarted Into Buying Lunch',
    text: 'Lin Ran\'s eyes nearly pop out of his skull. He immediately breaks into a violent coughing fit, clapping a hand over his mouth as he stares at her in shock. Glancing between the note and her calm face, he thinks to himself that when he had questions earlier, the problem wasn\'t him—something is definitely wrong with her! Who would have guessed that the aloof, icy campus goddess secretly had this kind of weird kink? Shaking his head and reminding himself she\'s just an eighteen-year-old girl, he picks up his pen and writes a firm refusal: "No way, pick something else." Su Qingyan narrows her eyes slightly at his rejection, then immediately writes a new line and slides it over: "Then treat me to lunch at noon." Staring at the paper, Lin Ran freezes, suddenly getting the distinct, creeping feeling that he just walked right into her trap from the very beginning. Beside him, Su Qingyan giggles softly to herself, thinking, "Little thing, as if Big Sister can\'t wrap you around her finger."',
  },
  {
    range: '09:50–10:25',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: 'Zhao Ke’s Boast Meets Su Qingyan',
    text: 'When the lunch bell finally rings, the classroom comes alive as students pack their bags and rush out. Lin Ran slings his backpack over one shoulder and heads toward the door, unaware that Su Qingyan is quietly rising from her seat to follow right behind him. Just outside the classroom door, Zhao Ke catches up and throws an arm around Lin Ran\'s shoulders, enthusiastically inviting him to grab lunch together. Grinning from ear to ear, Zhao Ke declares that today is his treat to celebrate Lin Ran\'s unbelievable luck of being hugged and having his hand held by the campus belle in a single morning. Lowering his voice, Zhao Ke remarks that Su Qingyan has never been that close with any guy before, and jokes while laughing uproariously that if she actually went to eat lunch with Lin Ran too, he\'d truly believe the two of them were dating! Before Zhao Ke can even finish laughing, Su Qingyan stops right beside them and calmly says, "Let\'s go eat."',
  },
  {
    range: '10:25–11:01',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: 'Zhao Ke’s Tactical Retreat',
    text: 'Zhao Ke\'s laughter dies in his throat, his jaw dropping open. Remembering that he only has a hundred yuan a week for food and needs to save every penny he can, Lin Ran immediately points a finger at his friend and says, "Zhao Ke just said he\'s treating!" Su Qingyan slowly turns her head and locks her piercing, icy glare onto Zhao Ke, asking in a freezing tone, "You\'re treating?" Out of pure reflex, Zhao Ke nods and shouts, "Yes, yes, my treat!" before noticing the murderous look in her eyes. Breaking into a cold sweat, he stammeringly asks, "Wait... should I treat, or not treat?" Su Qingyan flatly replies, "You\'re not treating." Instantly taking the hint, Zhao Ke shouts that he definitely isn\'t treating because his mom is suddenly giving birth to a second child at home, sprinting down the hallway while wailing for Lin Ran to save him! Cursing his friend for being a world-class chameleon, Lin Ran sighs in resignation and walks off with Su Qingyan.',
  },
  {
    range: '11:01–11:36',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: 'Avoiding the Cafeteria Assassination List',
    text: 'Moments later, Zhao Ke pokes his head out from around the hallway corner, watching in stunned silence as Lin Ran and Su Qingyan walk side by side down the sunlit corridor. His jaw trembles as he whispers in disbelief, "No way... are they actually dating?!" Outside on the sports field, students sprint past a smiling Mr. Liu toward the school cafeteria. Walking along the quiet, tree-lined campus path with Su Qingyan beside him, Lin Ran suddenly realizes a terrifying problem: if he walks into the crowded school cafeteria with the campus belle in front of the entire student body, by tomorrow morning he\'ll be at the very top of the male students\' assassination list! Stopping in his tracks, he quickly gestures toward the main gate and suggests they eat at a small place outside the school instead, to which she readily agrees.',
  },
  {
    range: '11:36–12:16',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: 'Alan’s Restaurant & The “Meat Allergy”',
    text: 'Stepping through the curtain of a small local eatery called Alan\'s Restaurant, they take a seat as the owner calls out asking what the two students would like to eat. Lin Ran glances up at the menu board on the wall and instantly breaks into a cold sweat: shredded pork with green peppers over rice is six yuan, beef and potato rice is eight yuan, and the pork patty and chicken cutlet combo is nine yuan! Reaching into his pocket to clutch his crumpled bills, he cries inwardly at how terrifying these prices are—his weekly allowance is only a hundred yuan, leaving him barely twenty yuan a day to spend. He may have been reborn in a younger body, but his wallet is about to bleed dry! After Su Qingyan orders a scallion lamb rice bowl and asks what he wants, Lin Ran winces and orders the five-yuan tomato and egg rice, the absolute cheapest dish on the menu. Surprised, she asks why a growing boy his age isn\'t eating meat, so he awkwardly lies that he\'s "allergic to meat"—while weeping inside that he\'s actually allergic to expensive things!',
  },
  {
    range: '12:16–12:52',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: 'Upgraded to Beef Rice & A Shocking Bomb',
    text: 'Seeing right through his excuse, Su Qingyan scoffs, "Nonsense," and calls out to the owner to switch his order to the beef and potato rice bowl and bring two cans of chilled sour plum drink, telling Lin Ran that he needs to eat more meat to have the energy to study. Staring at the two red cans placed on the table, Lin Ran holds back tears, thinking it\'s easy for her to be generous when it isn\'t her money being spent! Letting out a heavy sigh, he pops open a can and gulps down the cold plum drink to soothe his aching wallet. Across the table, Su Qingyan daintily lifts her can, takes a slow sip, and casually remarks, "More than half of your weekly living allowance was spent on Shen Lingshan." Lin Ran violently chokes and spits out his drink, coughing uncontrollably with his face flushed bright red as he gasps, "How do you know that?!" With a serene smile, she replies that plenty of people at school know—she just heard it around.',
  },
  {
    range: '12:52–13:28',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: 'Su Qingyan’s Romance Safety Lecture',
    text: 'Devastated, Lin Ran slams his forehead straight onto the wooden table, groaning in despair that his shameful history as a simp has already spread to every corner of the school. Watching him wallow in embarrassment, Su Qingyan narrows her eyes thoughtfully. In her mind, she reasons that her silly little deskmate has a pure, introverted personality, making him no match at all for a scheming, manipulative "green tea" woman like Shen Lingshan—if she isn\'t careful, he\'ll get tricked again, so she has to teach him a proper lesson right now! Clearing her throat as Lin Ran sits back up, she launches into a serious lecture: it\'s completely understandable for a boy his age to have vague longings and crushes on the opposite sex, but even boys need to learn how to protect themselves out in the world. The world of romance is very dangerous, she warns, and he shouldn\'t let himself get fooled by a few sweet words from girls, or it\'ll be too late when he regrets it.',
  },
  {
    range: '13:28–14:06',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: 'Reciting His Tenth-Grade Simp History',
    text: "Lin Ran blinks in utter confusion, wondering why his campus belle deskmate is suddenly lecturing him like a parent—and about relationship advice, of all things! Noticing his pouting, unconvinced expression, Su Qingyan tilts her head with a teasing smile and asks, \"What, you're not convinced? Do you think you're actually very smart and definitely wouldn't get tricked so easily?\" Lin Ran smirks to himself—of course he wouldn't! He is a proud regressor with a thirty-four-year-old soul inside an eighteen-year-old body; what kind of storms hasn't he seen? Before he can even finish his smug thought, Su Qingyan calmly begins reciting his dark history: \"First semester of tenth grade, Shen Lingshan called you 'Brother Lin Ran' once, and you handed over your entire month's allowance to buy her a celebrity album. Last winter break, she said 'our Lin Ran,' and like a man possessed, you rode your bike every single day for half a month to deliver her love breakfasts.\"",
  },
  {
    range: '14:06–14:45',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: 'Double Social Death at the Lunch Table',
    text: 'Lin Ran\'s face drains of all color, his jaw trembling as he whispers a horrified curse under his breath. Taking a leisurely sip of her drink through a straw, Su Qingyan raises an eyebrow and asks, "There\'s plenty more. Do you want me to keep going?" Inwardly, she giggles to herself—it\'s nothing special, she only knows every single detail because she read somebody\'s entire diary from cover to cover! "Are you convinced yet?" she asks. Turning beet red from head to toe, Lin Ran groans, "I give up!" and slams his head right back onto the table. With ironclad evidence like that, his three years in high school as a "pure titanium-alloy simp" can never be washed clean! Lifting his head, he asks in desperation how she knows such specific details, and when she deadpans for the second time that "lots of people know, I just heard it around," he clutches his head and collapses onto the table again, suffering a second round of complete social death.',
  },
  {
    range: '14:45–15:21',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: 'Strict Rules Against Other Girls',
    text: 'Covering her mouth to hide a laugh, Su Qingyan regains her serious expression and tells him, "Now that you know, promise me you won\'t easily fall for people\'s tricks anymore, and stay far away from girls like that." Sitting up straight and clenching his fists, Lin Ran swears, "Definitely!" Inwardly, he is kicking himself for not keeping his mouth shut in the past, wishing he could have moved his rebirth date back two whole years just to wipe all that dark history off the face of the earth. Watching her eat a spoonful of rice with a stray grain adorably stuck to her cheek, Lin Ran listens as she continues her lecture: a boy his age needs to settle down, study hard, and focus on getting into a good university. "So," she says firmly, "if Shen Lingshan comes looking for you again, ignore her." Lin Ran nods: "Got it." "And if other girls ask you to hang out, learn to say no." "Deal!"',
  },
  {
    range: '15:21–15:56',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: '“We Are Deskmates, So It’s Normal”',
    text: 'Keeping a completely straight face, Su Qingyan rattles off even more rules: "If other girls ask you to treat them to a meal like I did today, firmly refuse." "Okay!" Lin Ran replies brightly. "And if you notice any other girls in our class or grade showing interest in you, report it to me immediately." "No problem—wait a second!" Lin Ran freezes mid-nod, his eyes narrowing as his brain finally catches up. Leaning forward, he asks why on earth he needs to report to her if other girls like him—and furthermore, if other girls aren\'t allowed to ask him to treat them to meals, why is it okay when she does it?! Without missing a beat, Su Qingyan replies that she is the class monitor, so it\'s her responsibility to make sure her classmates\' study mindset isn\'t affected. As for eating together, she closes her eyes and calmly states, "That\'s different. We are deskmates. Deskmates eating a meal together is completely normal."',
  },
  {
    range: '15:56–16:31',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: 'Thirty-Year-Old Soul Outsmarted Again',
    text: '"There\'s actually logic like that?!" Lin Ran mutters, leaning across the table to stare closely into her eyes until she shrinks back slightly. Rubbing his chin in deep thought, he reasons that an aloof, icy campus goddess like Su Qingyan has no reason to make up lies just to fool him. Besides, he reminds himself with a confident smirk, he lacked experience in his past life, but now he has the mature, wise soul of a man in his thirties—if his deskmate really had any hidden ulterior motives toward him, he would see right through them instantly. There is zero chance he\'s being tricked! Feeling genuinely touched by her concern for his future, his expression softens into a warm smile as he says, "Thank you." Su Qingyan freezes for a split second—inwardly squealing in disbelief that he\'s actually thanking her after getting played—before smiling back and saying, "You\'re welcome. It\'s what I should do."',
  },
  {
    range: '16:31–17:06',
    act: 'Act IV · Lunch Date & Dark History Exposed',
    sceneTitle: '“I’ll Pay for Lunch” — “Big Sister!”',
    text: 'Then, propping her chin on her hand and gazing at him with her clear blue eyes, Su Qingyan asks, "So... how do you plan to thank me?" A chill runs down Lin Ran\'s spine as he stammers, "How do you want me to thank you?" With a faint smile, she repeats her demand from class: "Call me Big Sister and let me hear it." Lin Ran immediately barks, "Can\'t do it!" Tilting her head, she asks softly, "What would it take for you to call me that?" Closing his eyes dramatically, Lin Ran declares, "Nothing in this world could ever make me call you that!" Su Qingyan\'s eyes glint with amusement as she whispers four words: "I\'ll pay for lunch." Instantly, Lin Ran\'s eyes light up with sparkling golden stars and a shameless grin spreads across his face as he cheers, "Big Sister! Big Sister! Big Sister!" Satisfied, Su Qingyan stands up, reaches out to gently pat and ruffle his hair while saying, "Good boy," and walks to the counter to pay the owner with a hundred-yuan bill.',
  },
  {
    range: '17:06–17:42',
    act: 'Act V · Convenience Store Showdown',
    sceneTitle: 'The Head-Pat Realization & Store Wait',
    text: 'Left sitting alone at the table as Su Qingyan walks out the restaurant door into the sunlight, Lin Ran slowly raises a trembling hand to touch the top of his head. Staring blankly into space, a delayed realization hits him: "Wait... did the little campus belle just take advantage of the moment to ruffle my hair?!" Outside on the sidewalk, Su Qingyan\'s cool demeanor melts into a beaming, blissful smile as she celebrates successfully taking advantage of little Lin Ran—his hair felt so soft and nice under her hand that she\'s definitely going to ruffle it again next time! Stopping in front of a convenience store as he catches up, she turns and tells him to wait by the door for a moment while she goes inside to buy a pack of wet wipes. Watching the automatic doors slide shut behind her, Lin Ran tries to convince himself that waiting for a deskmate outside a store is totally normal—until Shen Lingshan\'s annoying voice calls out "Lin Ran!" right behind him.',
  },
  {
    range: '17:42–18:17',
    act: 'Act V · Convenience Store Showdown',
    sceneTitle: 'Shen Lingshan’s Delusional Theory',
    text: "Turning around with a groan, Lin Ran sees Shen Lingshan standing in front of the noodle shop next door with her arms crossed and a smug, arrogant smile on her face, asking if he's finally ready to apologize to her. As it turns out, just a short while ago, Cui Qianqian had convinced Shen Lingshan that Lin Ran's cold attitude and bringing out Su Qingyan was all a deep, calculating mind game to get her attention—claiming that the more he puts on an act, the more it proves how desperately he likes her, and guaranteeing he wouldn't even last until afternoon dismissal before coming crawling back. Seeing Lin Ran standing alone outside the school gate during lunch break, Shen Lingshan is completely convinced Qianqian's prediction came true. Raising her chin haughtily, she warns him that if he wants her forgiveness this time, two or three casual gifts won't be nearly enough!",
  },
  {
    range: '18:17–18:55',
    act: 'Act V · Convenience Store Showdown',
    sceneTitle: 'Accused of Using Su Qingyan as an Act',
    text: 'Pinching the bridge of his nose in sheer exhaustion, Lin Ran asks, "Apologize for what?" He was just standing here minding his own business waiting for his deskmate—where on earth did this delusional "green tea" player pop out from? Refusing to believe him, Shen Lingshan smugly points out that he always eats in the school cafeteria, so coming out to the school gate today obviously means he was waiting for her to walk out. When Lin Ran flatly replies, "I\'m not waiting for you," she laughs mockingly and claims she already saw right through all his little tricks: he only spent all that effort begging Su Qingyan to act alongside him earlier because he wanted to make her jealous! At the mention of the name "Su Qingyan," a dark shadow falls over Lin Ran\'s face as he is instantly hit with traumatic flashbacks of having his entire simp history read aloud in the restaurant minutes ago.',
  },
  {
    range: '18:55–19:29',
    act: 'Act V · Convenience Store Showdown',
    sceneTitle: 'Shooing Away the Green Tea',
    text: 'Letting out a long, weary breath, Lin Ran realizes that his deskmate\'s lecture was completely right: staying entangled with a self-absorbed person like Shen Lingshan will only drag his life into misery. Putting on a sarcastic grin, he claps his hands and mocks her: "Oh, yeah, yeah, you saw right through me, you\'re truly amazing! Are you done talking? If you\'re done, go stay wherever you belong—I\'m waiting for someone here!" Waving his hand as if shooing away a fly, he tells her to get lost. Shen Lingshan\'s smug smile freezes and shatters. Her face flushing crimson with humiliation and rage, she clenches her fists and stomps right up to him, screaming that this is the very last chance she\'s giving him—he\'d better apologize to her right this second, or it\'ll be too late for regrets! Inside the convenience store, Su Qingyan stops right behind the glass door.',
  },
  {
    range: '19:29–20:06',
    act: 'Act V · Convenience Store Showdown',
    sceneTitle: 'Testing Her Student’s Progress',
    text: 'Holding a pack of wet wipes in her hand, Su Qingyan peers through the glass door with a playful smile and decides there\'s no rush to step outside just yet—it\'s the perfect time to test the results of the lesson she just taught her silly little deskmate and see how he performs on his own! Outside on the pavement, Lin Ran calmly asks what he could possibly have to regret. Puffing out her chest, Shen Lingshan declares that if he doesn\'t apologize right now, forget about holding hands—from this day forward, she will never speak another word to him or even spare him a single glance no matter how much he begs: "We are officially through!" Lin Ran\'s face lights up with a genuine smile: "Sounds great!" Enraged by his reaction, she shrieks, "What do you mean by that?!" With a deadpan expression, Lin Ran replies, "Literally what it means. My deskmate told me to study hard and stay away from shady, sketchy girls—specifically referring to you."',
  },
  {
    range: '20:06–20:47',
    act: 'Act V · Convenience Store Showdown',
    sceneTitle: 'Final Rejection & Fruit Candy Reward',
    text: '"Shady and sketchy?!" Shen Lingshan gasps, tears of fury springing to her eyes as she screams, "How dare you say that about me?!" Lin Ran spreads his hands innocently and says, "I didn\'t say it, my deskmate said it." Losing her mind completely, Shen Lingshan roars at the top of her lungs, "And you just listen to whatever your deskmate says?!" Lin Ran\'s expression cools into a calm, mocking smile: "If I don\'t listen to her, why on earth would I have to listen to you?" Speechless and utterly humiliated as pedestrians on the street stop to stare, Shen Lingshan bursts into tears, sobbing that she will never forgive him as she turns and runs across the crosswalk. Watching her leave without a shred of sympathy, Lin Ran hears the convenience store door slide open behind him. Stepping out with a handful of colorful fruit candies, Su Qingyan asks who he was just talking to. "Just a passerby, don\'t know her," he replies casually. Offering him the candies she got as change, Su Qingyan beams inwardly at his sweet answer, deciding her little dummy deserves a reward!',
  },
  {
    range: '20:47–21:21',
    act: 'Act VI · Mock Exam Challenge & One-on-One Tutoring',
    sceneTitle: 'Afternoon Sunlight & The Top Scorer',
    text: 'Back in the classroom as the afternoon sun streams through the windows, Su Qingyan rests her cheek on her hand and gazes fondly at the sleeping Lin Ran, telling herself it\'s time to work hard for the afternoon lessons. A little while later, Lin Ran wakes up, props his chin on his palm, and quietly watches Su Qingyan as she focuses on taking notes. With the golden sunlight framing her profile, he can\'t help blushing slightly, admiring how effortlessly brilliant she is—after all, in his previous life, she placed third in the entire southern province in the liberal arts college entrance exam and was their city\'s top scorer. Without even looking up from her notebook, Su Qingyan suddenly slips a piece of paper under his nose that reads: "Stop smiling like an idiot. Pay attention to class." Coughing awkwardly, Lin Ran sits up straight and pretends to read, while beside him, Su Qingyan hides a delighted smile, thrilled that her charm had him staring in a complete daze.',
  },
  {
    range: '21:21–21:58',
    act: 'Act VI · Mock Exam Challenge & One-on-One Tutoring',
    sceneTitle: 'Mr. Liu’s Second Mock Exam Explosion',
    text: 'Suddenly, Mr. Liu slams both hands onto the podium, startling the entire class as he announces next week\'s second mock exam. Pacing angrily in front of the blackboard, he berates Class Ten for their dismal performance in the first mock exam: out of the six liberal arts classes in their grade, their class average plummeted to second-to-last, they only ranked fourth in top-fifty placements, and they had a measly one student in the top ten, making him too ashamed to even lift his head in the teachers\' office! Listening calmly, Lin Ran smiles to himself, remembering that Old Liu had the exact same fiery temper in his past life because class exam rankings directly impacted his performance bonus. Right at that moment, Mr. Liu spots his smile and roars, "Lin Ran! Stand up!" As Lin Ran rises to his feet, the teacher furiously reads off his scores from the last exam: Math 71, Chinese 82, English 74, and comprehensive liberal arts 143—not even passing a single subject on average!',
  },
  {
    range: '21:58–22:33',
    act: 'Act VI · Mock Exam Challenge & One-on-One Tutoring',
    sceneTitle: 'Ranked 44th & The 20-Point Ultimatum',
    text: "Waving the score sheet in the air, Mr. Liu shouts that out of forty-nine students in the entire class, Lin Ran ranked forty-fourth—dropping six whole places since the midterm exams! Veins bulging on his forehead, the teacher complains that the Class Thirteen teacher mocked him in the office again today because a few bottom-ranking slackers are dragging down their entire class average. Pointing a trembling finger at Lin Ran, Mr. Liu orders him to improve his total score by at least twenty points in next week's mock exam, or he'll call his parents to the school! From the middle row, a male classmate laughs and calls out that raising his score by twenty points is way too hard for Lin Ran, since he's too busy chasing after the class belle of Class Seven to bother reviewing. Slamming the desk, Mr. Liu snaps that he doesn't care about any class belle—whether Lin Ran crams, memorizes textbooks until he drops, or asks a classmate to tutor him, he only cares about the results!",
  },
  {
    range: '22:33–23:12',
    act: 'Act VI · Mock Exam Challenge & One-on-One Tutoring',
    sceneTitle: '“I’ll Aim to Improve by 200 Points”',
    text: 'The mocking classmate grins and chimes in again, telling Mr. Liu to forget about having someone tutor Lin Ran—wouldn\'t that just drag down another innocent student? Since Lin Ran has a "love-struck brain," he jokes, what if he infects his tutor and they both fail together? The entire classroom erupts into raucous laughter. Standing tall amidst the jeers, Lin Ran remains completely unfazed; with the mature soul of a man in his thirties, such childish malice doesn\'t even scratch him, and with his adult knowledge, raising his high school grades is effortless. Looking calmly at the podium, he says, "It\'s fine, Mr. Liu, I can review on my own. I\'ll aim to improve by about two hundred points." The room explodes into even louder laughter. Pointing at him with tears of mirth, the jeering boy yells that Lin Ran would be lucky to improve by two points, adding sarcastically that at least Lin Ran has the self-awareness to know none of the top students in class would ever bother talking to him.',
  },
  {
    range: '23:12–23:44',
    act: 'Act VI · Mock Exam Challenge & One-on-One Tutoring',
    sceneTitle: '“I Will Tutor Lin Ran”',
    text: 'Frowning at the disruption, Mr. Liu waves his hand and tells Lin Ran to just focus on self-studying then, adding that if he genuinely runs into questions he doesn\'t understand, he can come ask him at the office. Before the teacher can finish his sentence, a clear, resolute voice rings out across the room: "There\'s no need to look for anyone else. I\'ll do it." The laughter dies instantly. The mocking boy nearly drops his Chinese textbook in terror as every head whips around to stare at Su Qingyan, who has stood up right beside Lin Ran. Looking straight ahead, the campus belle calmly declares, "I will tutor Lin Ran." Lin Ran stares at her in stunned silence, mourning inwardly that he was only halfway through showing off before his deskmate stole all his thunder! Panicking, another boy in the front row jumps up and protests that Su Qingyan can\'t be dragged down by Lin Ran when she needs to compete for first place in the entire grade!',
  },
  {
    range: '23:44–24:16',
    act: 'Act VI · Mock Exam Challenge & One-on-One Tutoring',
    sceneTitle: 'Class Monitor’sFlawless Justification',
    text: "Even Mr. Liu hesitates, nodding that the boy has a point, but Su Qingyan smoothly interrupts. Standing with poised confidence, she explains that as the class monitor, helping and tutoring her classmates is her duty to begin with. Furthermore, she assures the teacher, tutoring Lin Ran won't negatively affect her own grades at all—on the contrary, explaining test problems out loud will help her consolidate and master the material even better! Completely won over by her logic, Mr. Liu beams and officially assigns Lin Ran's tutoring to her, provided it doesn't tire her out. Then, switching back to a ferocious glare in a split second, he points at Lin Ran and warns him to cherish this rare opportunity, learn humbly from Qingyan, and not dare distract her—or he'll hold him personally accountable! Sitting back down with a helpless sigh, Lin Ran leans over and whispers to her that she really doesn't need to go to such trouble since he can manage fine on his own.",
  },
  {
    range: '24:16–24:53',
    act: 'Act VI · Mock Exam Challenge & One-on-One Tutoring',
    sceneTitle: 'Planning Hand-in-Hand Tutoring',
    text: 'Turning her head slightly, Su Qingyan meets his gaze with her cool, composed eyes and tells him not to misunderstand—she isn\'t doing this specially to help him, she is simply fulfilling her obligation as class monitor and his deskmate. Hearing her standard excuse, Lin Ran smiles and whispers, "Thank you," to which she replies, "You\'re welcome." Yet the moment she turns away, her internal monologue goes wild: how dare that bunch of jerks bully her little deskmate?! If they won\'t tutor him, she, Su Qingyan, will do it herself! Squealing inwardly with excitement, she celebrates landing another completely legitimate excuse for one-on-one, close-contact time with him—wondering where she should start tutoring him, and whether she should teach him "hand-in-hand"! Later that evening in the sunset-lit cafeteria, Zhao Ke clasps his hands together in pure worship across the dinner table, marveling that after eating lunch together, the campus belle even volunteered to tutor him—even if Lin Ran bombs the mock exam and gets his parents called, such a blessing makes it all worth it!',
  },
  {
    range: '24:53–25:32',
    act: 'Act VI · Mock Exam Challenge & One-on-One Tutoring',
    sceneTitle: 'Zhao Ke’s Handstand Bet',
    text: 'Picking up a piece of greens with his chopsticks, Lin Ran calmly asks, "Who said I\'m going to bomb this exam? Even without anyone tutoring me, I\'ll improve by at least two hundred points this time." Zhao Ke stares at him in pity, shaking his head and sighing that getting a one-on-one session with the campus belle has clearly driven Lin Ran crazy enough to talk nonsense in broad daylight. Counting on his fingers, Zhao Ke points out that Lin Ran scored 370 last time—improving by two hundred points would mean scoring 570, which would put him in the top fifteen of the entire class! Smirking at his friend\'s disbelief, Lin Ran suggests they make a bet on it. Pounding his chest in absolute confidence, Zhao Ke vows that if Lin Ran actually improves by at least two hundred points on the second mock exam, he will go to the school track at night, do a handstand, and run three laps completely naked! Laughing at how bold Zhao Ke is, Lin Ran asks what happens if he loses—to which Zhao Ke leans in with sparkling eyes and begs him to teach a masterclass on how he won over Su Qingyan.',
  },
  {
    range: '25:32–26:17',
    act: 'Act VI · Mock Exam Challenge & One-on-One Tutoring',
    sceneTitle: 'Jealousy Flare at the Girls’ Table',
    text: 'At another table across the cafeteria, Su Qingyan\'s three female friends lean in curiously and ask her to be honest: why on earth did she agree to tutor Lin Ran when that isn\'t like her at all? Stirring her soup calmly, Su Qingyan replies that it\'s nothing special—she\'s the class monitor and he\'s her deskmate, so she\'s just lending a hand. Looking up with a teasing smile, she asks, "Otherwise, could it be that I\'ve fallen for him?" Her friends immediately burst into laughter, agreeing that as Yunan High\'s top campus belle, there\'s no way she would ever fall for a bottom-ranking slacker, assuming she was just being kindhearted. Dabbing her lips with a napkin, Su Qingyan smiles smugly to herself at how easily she fooled them—it\'s still too early to make their relationship official, she wants to tease her little deskmate first! Suddenly, one of the girls blushes and remarks that Lin Ran actually looked really handsome today—the cute, well-behaved younger-brother type—and says if Qingyan really isn\'t interested, she might try pursuing him herself! Instantly, Su Qingyan slams her hand and chopsticks onto the table. Fixing her friend with a terrifying, glowing blue glare, she coldly warns, "The second mock exam is right around the corner. Focus on reviewing, and stop thinking about things you shouldn\'t!"',
  },
  {
    range: '26:17–26:48',
    act: 'Act VI · Mock Exam Challenge & One-on-One Tutoring',
    sceneTitle: 'Evening Self-Study & The English Test',
    text: 'Later during evening self-study in the golden glow of sunset, Su Qingyan pulls her chair right up beside Lin Ran\'s desk and asks which subject he wants to start being tutored in first. Still trying to spare her the effort, Lin Ran suggests they forget about it since he can study on his own. Raising an eyebrow, Su Qingyan pulls out an English exam paper from the prestigious Shi\'an Key High School, places it in front of him, and tells him to complete the cloze comprehension section—if he gets fewer than eight questions wrong in total, she\'ll believe he can study by himself. Saying "Sure," Lin Ran picks up his pen and begins filling in the answers effortlessly. Resting her chin on her hand as she watches him work in the warm evening light, Su Qingyan\'s lips curve into a sly, blushing smile. She knows for a fact that this test paper is notoriously difficult and figures he\'ll get at least half of it wrong—and when that happens, she\'ll have every excuse to tutor him one-on-one, hand-in-hand.',
  },
];

export const INITIAL_SCRIPT_SEGMENTS: ScriptSegment[] = RAW_SEGMENTS.map(
  (item, idx) => {
    const [startStr, endStr] = item.range.split('–');
    const startSec = parseTime(startStr);
    const endSec = parseTime(endStr);
    return {
      id: `seg-${String(idx + 1).padStart(2, '0')}`,
      index: idx + 1,
      timestampRange: item.range,
      startTimeStr: startStr,
      endTimeStr: endStr,
      startSeconds: startSec,
      endSeconds: endSec,
      targetDurationSeconds: endSec - startSec,
      act: item.act,
      sceneTitle: item.sceneTitle,
      pauseNote: item.pauseNote,
      text: item.text,
    };
  }
);

export function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

export function formatSecondsToMMSS(totalSeconds: number): string {
  const sec = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatSrtTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}
