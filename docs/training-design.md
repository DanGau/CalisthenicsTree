# Training design

- **Tree.** Branches radiate from the centre. `tier` is distance from the centre; `lane` shifts a skill sideways for forks. Each branch's last tier is a keystone. Colours follow Path of Exile attributes: strength red, movement green, mobility blue.
- **Links.** Solid lines join skills in a branch; dashed lines bow toward the centre for cross-branch prerequisites (crow → tuck planche).
- **Status.** Locked until every prerequisite is mastered, but any skill can be started. Ticking a challenge makes it active; ticking all of them masters it.
- **Challenges.** Three or more per skill, easiest first. The last is the mastery test.
- **Check-in.** Questions place you on the tree (granting skills and their prerequisites) and set focus branches.
- **Today.** Three areas picked at random each day (focus branches first, one per branch). Each block: a builder (the hardest prerequisite's mastery test), work sets at the level reached, one try at the next level, and a progression rule by kind. "Give me more" adds another area.
- **Progress** lives in localStorage; Progress has copy/restore backup.
- Progressions loosely follow https://thegravgear.com/blogs/calisthenics/bodyweight-fitness-progression, extended with mobility, flexibility, backbends, animal flow, capoeira and breaking, tumbling, and parkour.
