// Report copy for the 4-question event quiz, copied verbatim from the live
// results pages at body.wearemomentmakers.com/r/{id} (version "event-v1").
// Differences: the booking button reads "Schedule My Session", and the
// section 06 copy frames the full 75-minute session ("Within the first 20
// minutes...") since event takers already had a free 20 minutes.
import type { Pattern } from "../questions";

export type ReportCopy = {
  name: string;
  tagline: string;
  familiar: string[];
  costs: { title: string; tail: string | null; detail: string | null }[];
  capacity: string;
  building: (string | { label: string })[];
  compass: { key: string; title: string; body: string; note: string }[];
  map: string[];
  cta: string[];
};

export const REPORTS: Record<Pattern, ReportCopy> = {
  "HOLDER": {
    "name": "THE HOLDER",
    "tagline": "Your body learned that holding on works. Nobody told it the job ended.",
    "familiar": [
      "It's nine at night. Nobody is looking at you. Your stomach is still sucked in.",
      "You get out of the car and your hand is still shaped like the steering wheel.",
      "You lean over the cutting board and both knees are locked, like you've been standing guard over a pile of carrots.",
      "Your body has learned to hold.",
      "And it pays you for it. Solid. In control. Ready. You can make that feeling happen in under a second, which is more than most people can do.",
      "Here's the receipt. The meeting ended three hours ago and your shoulders are still in it. The climb ended and your forearms never got the news. You're on the couch next to someone you love and your body is still staging for whatever comes next.",
      "Your grip is strong enough to defuse a bomb and you are holding a fork.",
      "Real talk.",
      "If nothing interrupts this, your jaw will still be clenched at your retirement party."
    ],
    "costs": [
      {
        "title": "You grip the wheel in traffic that isn't going anywhere.",
        "tail": null,
        "detail": "You arrive everywhere already tired, and you stopped noticing years ago, because tired is just what arriving feels like now."
      },
      {
        "title": "You hold your breath answering email, like exhaling might read as unprofessional.",
        "tail": null,
        "detail": "Eight hours of that is why you can't explain where the day went. You didn't move."
      },
      {
        "title": "Your neck and low back have opinions now.",
        "tail": null,
        "detail": "The massage that used to fix it buys you two days. You've started wondering whether this is the thing that ends in a scan and a surgeon's opinion."
      },
      {
        "title": "You get into bed with somebody and your body is still on the clock.",
        "tail": null,
        "detail": "You want to be here for this. Some part of you is still at work."
      }
    ],
    "capacity": "RELEASE",
    "building": [
      {
        "label": "The question to carry around with you"
      },
      "Can I do this with 10% less effort?",
      "Walking. Sitting. Carrying the groceries. Talking to your boss. Ten percent less in your jaw, your hands, your belly. You're not going limp. You're finding out how little you actually need, and the number is going to annoy you."
    ],
    "compass": [
      {
        "key": "SENSE",
        "title": "The Grip Check",
        "body": "Whatever is in your hand right now. Notice how hard you're holding it. Loosen until it almost slips. Three breaths.",
        "note": "That gap is what you've been donating for free."
      },
      {
        "key": "TRANSITION",
        "title": "The Threat Audit",
        "body": "Red light. Kettle boiling. Scan jaw, chest, gut, hands. Ask what you're preparing for. If the honest answer is nothing, pick one moment from today you're still holding and put that one down.",
        "note": "Notice whether there's a version of ready that doesn't come pre-braced."
      },
      {
        "key": "DISTRIBUTE",
        "title": "Soften One Spot",
        "body": "Mid-movement, find the place gripping hardest. Shift slightly. Let that one place soften and keep it a secret from the rest of you.",
        "note": "Notice what everything else does about it."
      },
      {
        "key": "ADAPT",
        "title": "The Savor Dial",
        "body": "Let something go, then stay there. Five extra breaths. Most people release and immediately go find something new to hold.",
        "note": "Savoring is a skill and you have been skipping practice."
      }
    ],
    "map": [
      "HOLD",
      "NOTICE",
      "RELEASE",
      "SAVOR",
      "ENERGY YOU GET TO SPEND"
    ],
    "cta": [
      "Within the first 20 minutes of your session, we find the one place your body is working overtime. The spot that's tight every single day. The shoulder that stopped going overhead. The hip you've quietly started googling.",
      "We change it while you're on the table, and you feel the difference before you put your shoes back on.",
      "Then you drive home with the energy that used to go into holding, and you spend it on people you like."
    ]
  },
  "DRIVER": {
    "name": "THE DRIVER",
    "tagline": "The problem starts when stopping feels illegal.",
    "familiar": [
      "You sit down. Ten minutes in, your brain opens negotiations.",
      "“We could at least answer those texts.”",
      "You finish the ride and you're planning the next one before your heart rate comes down.",
      "You get a free Saturday and by ten in the morning you've given it a job.",
      "Your body has learned to keep producing.",
      "You can push. You can focus. You can carry more than the people around you and still be pleasant about it. That bought you your career and most of your reputation.",
      "Then the invoice shows up. Heavy legs. Flat energy. A short fuse with the person who deserves it least. Sleep that repairs nothing. Dragging yourself through a session that used to be easy.",
      "And the thought:",
      "“I just need to recover.”",
      "Which you say the way other people say they should drink more water.",
      "Real talk.",
      "You are the most obedient person you know and you cannot name who you're obeying."
    ],
    "costs": [
      {
        "title": "You keep going past the point your body asked you to stop",
        "tail": ", like a phone at one percent insisting it's fine. That's how the last injury happened, and you know exactly which one I mean.",
        "detail": null
      },
      {
        "title": "Sitting still for ten minutes is harder than reorganizing a drawer that was completely fine.",
        "tail": null,
        "detail": "The quiet costs you something, and you'd rather pay in tasks."
      },
      {
        "title": "You find out what a hard week cost you two days later, standing in the shower.",
        "tail": null,
        "detail": "By then you've already said yes to the next one."
      },
      {
        "title": "Your partner gets the version of you that's still running.",
        "tail": null,
        "detail": "You're in the room. Technically."
      }
    ],
    "capacity": "RECOVERY",
    "building": [
      "Okinawans have a phrase for the way they eat.",
      "Hara hachi bu.",
      "Stop at eighty percent full. Still satisfied, still light, still able to get up and move.",
      {
        "label": "Your question"
      },
      "Can I stop while I still have something left?",
      "Not collapsing. Not waiting until your body takes the keys away from you. Leaving the table while you still feel good."
    ],
    "compass": [
      {
        "key": "SENSE",
        "title": "The Full Stop",
        "body": "Before the next thing, stop moving for ten seconds. Feel both feet.",
        "note": "Find out whether the last thing ended in your body or only on your calendar."
      },
      {
        "key": "TRANSITION",
        "title": "The Savoring Pause",
        "body": "End of the workday. Unclench your jaw on purpose. Let your shoulders drop, even if they climb back up. The second you feel slightly more settled, stay there and enjoy it for a few breaths.",
        "note": "Arriving at rest takes you ninety seconds. Staying is the part you've never practiced."
      },
      {
        "key": "DISTRIBUTE",
        "title": "Pass the Baton",
        "body": "One thing today you'd normally power through yourself. Hand it to somebody else, or hand it to tomorrow.",
        "note": "Notice the urge to take it back, then leave it gone for an hour."
      },
      {
        "key": "ADAPT",
        "title": "The Ten Minute Early Exit",
        "body": "Pick one thing on your calendar and leave ten minutes before you planned to. The meeting, the work block, the gym.",
        "note": "Find out who you are for the hour afterward."
      }
    ],
    "map": [
      "PRODUCE",
      "STOP",
      "RECOVER",
      "SAVOR",
      "PRODUCE AGAIN"
    ],
    "cta": [
      "Within the first 20 minutes on the table, you're with somebody whose entire job is getting your body to come down.",
      "We find where the week is still stored. The neck that won't turn all the way. The hip flexors that never fully let go. The back that starts talking every Thursday. You feel it release while it's happening, which is a sensation most drivers have not had in years.",
      "You leave with a body that believes the day is over. Then you sleep like it."
    ]
  },
  "COMPENSATOR": {
    "name": "THE COMPENSATOR",
    "tagline": "One side of your body is doing somebody else's job.",
    "familiar": [
      "Your right hip gets tired. Your left leg picks up the tab.",
      "One shoulder gets cranky. The other one starts working weekends.",
      "Your ankle doesn't love the movement, so your knee renegotiates the deal.",
      "The job still gets done, so you keep using the route.",
      "Your body has learned to redistribute.",
      "This is one of the smartest things a body does. It's the reason you've trained through things other people sat out.",
      "Then the workaround becomes the road. Same shoulder for the bag, every time. Same leg holding you up at the kitchen counter. One hip tucked under you through hour three of a Zoom call. Six months ago you changed how you do one movement because something felt weird, and you're still doing it the new way.",
      "Your left side has been quiet so long the two of you would have to be reintroduced.",
      "Real talk.",
      "One side of your body has been doing unpaid labor since college. No raise, no thanks, no exit interview."
    ],
    "costs": [
      {
        "title": "The same shoulder, hip, or knee keeps coming up like a recurring guest star.",
        "tail": null,
        "detail": "You've paid four people to look at it. It always comes back."
      },
      {
        "title": "It improves in one spot, then relocates, like it wanted a change of scenery.",
        "tail": null,
        "detail": "You've started to wonder whether anyone can actually fix this or whether this is just your body now."
      },
      {
        "title": "You've rebuilt your climbing, your run, your lift around a limitation you never addressed.",
        "tail": null,
        "detail": "You're slower than you should be and you know it isn't fitness."
      },
      {
        "title": "On the floor with your kid, or staying in one position with your partner, one side is already voting to leave.",
        "tail": null,
        "detail": "You cut things short and blame your age."
      }
    ],
    "capacity": "DISTRIBUTION",
    "building": [
      {
        "label": "Your question"
      },
      "Can the rest of my body help with this?",
      "Forget symmetry. Symmetry is a story sold by people with posture charts. What you want is more than one way to do the same thing."
    ],
    "compass": [
      {
        "key": "SENSE",
        "title": "Who's Talking Loudest",
        "body": "Carrying, standing, walking, your first set. Feel both feet, both hands, both sides of your back. Change nothing.",
        "note": "Just get the name of who's running the meeting."
      },
      {
        "key": "TRANSITION",
        "title": "The Reset Step",
        "body": "When you finish one thing, take a few full steps before the next. Notice how the walk feels on each side. Roll each shoulder once.",
        "note": "Old asymmetries get loud in the switch, which is exactly why you've never caught them."
      },
      {
        "key": "DISTRIBUTE",
        "title": "Share the Work",
        "body": "During a movement you know by heart, shift your position slightly and deliberately invite more of the crew in. Feet, legs, hips, trunk, arms.",
        "note": "Notice how the job changes when more of the crew shows up."
      },
      {
        "key": "ADAPT",
        "title": "Switch Hands",
        "body": "Brush your teeth, carry the bag, start the movement with the other side.",
        "note": "Watch what your dominant side does automatically that this side is figuring out from scratch."
      }
    ],
    "map": [
      "ONE SIDE COVERS",
      "NAME WHO'S WORKING",
      "SHARE THE LOAD",
      "MORE OPTIONS",
      "MORE FREEDOM"
    ],
    "cta": [
      "You cannot see this one from the inside. That is the entire problem with it.",
      "Within the first 20 minutes, I watch you move and tell you who has been covering for who. Then we hand some of the work back, and you feel the side that's been carrying you finally set it down.",
      "The hip that aches every ride. The shoulder that won't press overhead. The thing four people have already looked at. We start where it actually starts, which is usually nowhere near where it hurts."
    ]
  },
  "OVERRIDER": {
    "name": "THE OVERRIDER",
    "tagline": "Your body tells you the truth. You go, \"huh? sorry, I'm busy.\"",
    "familiar": [
      "You finish the session.",
      "“That was harder than I thought.”",
      "You get home.",
      "“Why am I this wrecked?”",
      "Somebody asks if that hurts. You pause. You check. You've been ignoring it for forty five minutes.",
      "You know your numbers. The time, the grade, the weight, whether you hit the thing you set out to hit. Ask what the movement actually felt like and suddenly you're running an archaeological dig through your own body.",
      "Your body has learned to override.",
      "You execute. You finish. You hold discomfort and keep your attention on what matters. That makes you excellent, and it makes the quiet information impossible to hear.",
      "Performance is a box checker. It does the thing so the thing is done. It never stops to savor anything.",
      "So the signal shows up late. The workout ends before you notice how tired you were. The meeting ends before you notice what your neck did for an hour. You get home and everything files in at once.",
      "Real talk.",
      "You know your body the way a landlord knows a property. You check on it when something breaks."
    ],
    "costs": [
      {
        "title": "You can finish something hard and have no idea how it felt, only what it produced.",
        "tail": null,
        "detail": "You're chasing a feeling you're never actually present for."
      },
      {
        "title": "You find out about an injury when it starts affecting your numbers.",
        "tail": null,
        "detail": "By then it's eight weeks off, not one."
      },
      {
        "title": "You push through a signal your body sent a while back, like an email you meant to answer.",
        "tail": null,
        "detail": "You're not scared of pain, which is exactly why yours gets expensive."
      },
      {
        "title": "In bed, in a great meal, on a perfect day outside, you're accounted for but not really there.",
        "tail": null,
        "detail": "The good part is happening and you're watching the scoreboard."
      }
    ],
    "capacity": "SENSATION",
    "building": [
      {
        "label": "Your question"
      },
      "Can I feel more of this while it's happening?",
      {
        "label": "And the one underneath it"
      },
      "Can I find pleasure in the small stuff?",
      "You keep every bit of the performance. You stop paying for it with the experience."
    ],
    "compass": [
      {
        "key": "SENSE",
        "title": "60-Second Arrival",
        "body": "Before you start, feel both feet. Notice your breath. Name one specific sensation: texture, temperature, pressure, rhythm. Then begin.",
        "note": "Tell the voice that's analyzing you to be quiet. Tell the voice that wants you to perform: I am already impressed by you."
      },
      {
        "key": "TRANSITION",
        "title": "The Debrief",
        "body": "The second you finish, before you touch your phone, say out loud how it felt. Not the numbers. The texture, the rhythm, where the effort lived.",
        "note": "Notice whether you can describe the experience at all, or only the score."
      },
      {
        "key": "DISTRIBUTE",
        "title": "Name Three Things",
        "body": "Mid-movement, name three sensations. A texture. A rhythm. A point of contact. Change something slightly and go looking for a fourth.",
        "note": "Notice how much was available the whole time."
      },
      {
        "key": "ADAPT",
        "title": "The Feel-First Rep",
        "body": "One rep, one set, one attempt, slower than usual, attention on the feel instead of the outcome. Then go back to your normal speed and compare.",
        "note": "Notice what your usual speed costs you."
      }
    ],
    "map": [
      "PERFORM",
      "NOTICE",
      "SAVOR",
      "RESPOND",
      "MORE CHOICE"
    ],
    "cta": [
      "You can practice most of this alone. The part you can't do alone is feel something you've spent twenty years training yourself to ignore.",
      "That's what the session is for. Within the first 20 minutes, I put my hands on the place you've been overriding. The shoulder you've been managing. The hip that's been sending letters since spring. We slow it down until you can actually feel what's there.",
      "Most people get surprised twice. First by how much was going on in there. Then by how good it feels when it finally lets go.",
      "You spend a lot of your life inside that body. It's worth knowing what's happening in it."
    ]
  }
};
