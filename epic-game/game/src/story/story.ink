// The Last Lantern — main story script.
// Written in Ink (https://www.inklestudios.com/ink/). Lines like "Mira: ..." are
// shown with a speaker name; lines without one are narration.
// The game reads quest_accepted / beacon_lit back out, and writes enemies_left in.

VAR quest_accepted = false
VAR beacon_lit = false
VAR enemies_left = 0

=== mira ===
{ beacon_lit:
    -> after
}
{ quest_accepted:
    -> reminder
}
Mira: You came up the cliff road? Then you've seen it. The lantern on the ridge has gone dark.
Gimlet: Saw it. Figured somebody forgot to pay the light bill.
Mira: Without it, the Hollow ones walk freely.
* [What are the Hollow ones?]
    Mira: Shapes the dark leaves behind. They hate the light, and anyone who carries it.
    -> offer
* [I'm only passing through.]
    Gimlet: Just passing through. Places to be, bottles to sell.
    Mira: Nobody "only passes through" Emberfall. Not anymore.
    -> offer

= offer
Mira: Take this ember. Carry it up to the beacon on the ridge and light it again.
* [I'll do it.]
    ~ quest_accepted = true
    Gimlet: Danger and Sons. We deliver.
    Mira: Then go. They'll smell the ember on you. Strike first.
    Mira: And those bottles of yours... if you're going to drink one, find cover first.
    -> END
* [Find someone else.]
    Mira: There is no one else. Come back when you've decided.
    -> END

= reminder
Mira: The ridge is north, past the old stones. Keep the ember close.
-> END

= after
Mira: Look at it. I'd forgotten how far that light reaches.
Mira: Emberfall owes you a debt, Gimlet. Stay a while.
Gimlet: First round's on me.
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
    Something moves at the edge of the firelight. You can't light it with the Hollow ones at your back.
    -> END
}
The ember in your hand flickers, as if it knows where it is.
* [Light the beacon]
    ~ beacon_lit = true
    Fire climbs the old iron cage and spills across the valley.
    Far below, the last of the shadows come apart like smoke.
    -> END
* [Not yet]
    -> END
