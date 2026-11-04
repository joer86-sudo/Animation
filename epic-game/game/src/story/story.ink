// The Last Lantern: main story script.
// Written in Ink (https://www.inklestudios.com/ink/). Lines like "Mira: ..." are
// shown with a speaker name; lines without one are narration.
// The game reads quest_accepted / beacon_lit back out, and writes enemies_left
// (hostile Hollow ones only) and hero ("gimlet" or "kiai") in.
// Choices use "+" so they stay available when you talk to someone again.

VAR quest_accepted = false
VAR beacon_lit = false
VAR enemies_left = 0
VAR hero = "gimlet"

=== mira ===
{ beacon_lit:
    -> after
}
{ quest_accepted:
    -> reminder
}
Mira: You came up the cliff road? Then you've seen it. The lantern on the ridge has gone dark.
{ hero == "kiai":
    Kiai: Saw it. Heard it, too. Everything up there has gone so quiet.
- else:
    Gimlet: Saw it. Figured somebody forgot to pay the light bill.
}
Mira: Without it, the Hollow ones walk freely.
+ [What are the Hollow ones?]
    Mira: Shapes the dark leaves behind. They hate the light, and anyone who carries it.
    { hero == "kiai":
        Kiai: Or maybe nobody's ever sung to them.
        Mira: ...You're a strange one. I like it.
    }
    -> offer
+ [I'm only passing through.]
    { hero == "kiai":
        Kiai: Just passing through. One gig to the next.
    - else:
        Gimlet: Just passing through. Places to be, bottles to sell.
    }
    Mira: Nobody "only passes through" Emberfall. Not anymore.
    -> offer

= offer
Mira: Take this ember. Carry it up to the beacon on the ridge and light it again.
+ [I'll do it.]
    ~ quest_accepted = true
    { hero == "kiai":
        Kiai: KIAI! ...Sorry. Force of habit. Yes. I'll do it.
        Mira: Then go. They'll smell the ember on you.
        Mira: Play them something sweet first. Not everything out there wants to be broken.
    - else:
        Gimlet: Danger and Sons. We deliver.
        Mira: Then go. They'll smell the ember on you. Strike first.
        Mira: And those bottles of yours... if you're going to drink one, find cover first.
    }
    -> END
+ [Find someone else.]
    Mira: There is no one else. Come back when you've decided.
    -> END

= reminder
Mira: The ridge is north, past the old stones. Keep the ember close.
-> END

= after
Mira: Look at it. I'd forgotten how far that light reaches.
Mira: Emberfall owes you a debt, {hero == "kiai": Kiai|Gimlet}. Stay a while.
{ hero == "kiai":
    Kiai: Only if there's a stage.
- else:
    Gimlet: First round's on me.
}
-> END

=== beacon ===
{ not quest_accepted:
    The beacon is cold and silent. Someone in the village might know what happened here.
    -> END
}
{ beacon_lit:
    The beacon roars. Nothing from the dark will come near it tonight.
    -> END
}
{ enemies_left > 0:
    Something moves at the edge of the light. You can't light it with hostile Hollow ones at your back.
    -> END
}
The ember in your hand flickers, as if it knows where it is.
+ [Light the beacon]
    ~ beacon_lit = true
    Fire climbs the old iron cage and spills across the valley.
    { hero == "kiai":
        The Hollow ones who followed you up the hill sway in the glow. They don't look hollow anymore.
    - else:
        Far below, the last of the shadows come apart like smoke.
    }
    -> END
+ [Not yet]
    -> END

=== saz ===
{ beacon_lit:
    -> party
}
{ quest_accepted:
    -> before_ridge
}
{ hero == "kiai":
    Saz: Kiai! The keytar's back in town.
    Kiai: Did you miss me or the music?
    Saz: Yes.
- else:
    Saz: Gimlet! Thought I smelled trouble and cheap glass.
    Gimlet: It's artisanal glass, Saz.
}
Saz: Mira's been asking for someone brave. Or someone dumb enough. You fit one of those.
+ [What's going on up there?]
    Saz: The beacon's out. No light, no music, no dancing. It's a dark age, man.
    -> END
+ [Read me your arm again.]
    Saz: Funk. Soul. Jazz. Vibe. Kind. Every word four letters, every one earned.
    {hero == "kiai": Kiai|Gimlet}: And the one on your hand?
    Saz: Kind. Because you gotta be, even when it's dark out.
    -> END

= before_ridge
Saz: Heard you said yes. Respect. Keep low in the reeds. Those shadows can't see what they can't find.
{ hero == "kiai":
    Kiai: Sing to the sad ones, shred the mean ones. Got it.
- else:
    Gimlet: Stay still, hide, drink. Got it.
}
Saz: I was gonna say "be careful," but sure.
-> END

= party
Saz: You did it! Look at that glow. Now THAT'S a dance floor.
{hero == "kiai": Kiai|Gimlet}: Is that the point-up, point-down?
Saz: It's the only move that matters.
-> END

=== kiai ===
{ beacon_lit:
    -> encore
}
Kiai: Gimlet. You look like a man about to make a bad decision.
Gimlet: I'm always about to make a bad decision. It's the brand.
+ [What's with the keytar?]
    Kiai: This? Two settings. One sings so sweet the Hollow ones forget to be scary.
    Kiai: The other one... well. KIAI.
    Gimlet: Noted. Stand behind you, not in front.
    -> END
+ [Coming up the ridge?]
    Kiai: Someone has to keep the village from getting too quiet while you're gone.
    Kiai: Bring the light back and I'll play you an encore.
    -> END

= encore
Kiai: You did it! Okay, okay, one encore. Saz, you're on the dance floor.
Saz: Born ready.
-> END
