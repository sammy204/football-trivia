# Fixes And Backlog

This file tracks the work we've already discussed but have not fully implemented or finished validating yet.

## High Priority

- Common Link multiplayer
  - Add a real room/session flow for two or more players.
  - Sync questions, answers, and results across participants.

- Common Link coin awards
  - Verify the deployed coin backend accepts `commonlink_reward`.
  - Confirm leaderboard saves and coin awards both complete without 403 errors.

- Tournament mode expansion
  - Finish the sport -> tournament type -> setup flow.
  - Add real behavior for `Common Link Cup`.
  - Add real behavior for `Lightning Cup`.

- Tournament UI polish
  - Tighten spacing and card hierarchy after the new hub redesign.
  - Make each tournament mode feel distinct without breaking app-wide styling.

## Feature Ideas

- Clan / party system
  - Persistent groups that survive across games.
  - Clan invites, member lists, clan stats, and clan activity.

- Match history upgrades
  - Better rematch cards.
  - More readable match summaries.

- Reward balancing
  - Revisit coin payouts for Common Link and other newer modes.
  - Keep rewards exciting without making them too generous.

- Public tournament improvements
  - Verify expiry cleanup stays reliable.
  - Add clearer expiry labels in the public tournament browser.

## Nice To Have

- Spectator mode
- Custom tournament brackets
- Season pass or challenge track
- Shareable match cards

## Notes

- Some changes in this app depend on the backend being redeployed after code updates.
- The coin system currently uses backend checks for signed-in players, so reward-related changes should be tested end-to-end.
