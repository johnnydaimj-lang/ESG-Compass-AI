{{> group-method}}

你会收到一个根材料和多个候选材料。逐个比较候选与根材料，保持候选输入顺序，不能因为候选之间相似而推断它们都与根材料相同。

只返回合法 JSON 数组，每项格式为：

`{"materialId":"","relation":"SAME_OCCURRENCE|SAME_STORY|UNRELATED|ROUNDUP","confidence":0,"reason":"20字内依据"}`
