# Training design

- **Tree.** Branches radiate from the centre. `tier` is distance from the centre; `lane` shifts a skill sideways for forks. Each branch's last tier is a keystone. Colours follow Path of Exile attributes: strength red, movement green, mobility blue.
- **Links.** Solid lines join skills in a branch; dashed lines bow toward the centre for cross-branch prerequisites (crow → tuck planche).
- **Status.** Locked until every prerequisite is mastered, but any skill can be started. Ticking a challenge makes it active; ticking all of them masters it.
- **Challenges.** Three or more per skill, easiest first. The last is the mastery test.
- **Check-in.** Questions place you on the tree (granting skills and their prerequisites) and set focus branches.
- **Today.** One skill per branch: in-progress first, then the nearest open skill; focus branches lead; mobility always gets a slot.
- **Progress** lives in localStorage; Progress has copy/restore backup.
- Progressions loosely follow https://thegravgear.com/blogs/calisthenics/bodyweight-fitness-progression, extended with mobility, flexibility, backbends, animal flow, capoeira and breaking, tumbling, and parkour.
