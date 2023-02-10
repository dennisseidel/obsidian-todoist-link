import { clearTaskFormatting, findWikiLink, getDueDate, getPriority, isTask } from './utility';


test('test find wiki link', () => {
    expect(findWikiLink("Do this.  [[Task]]")).toMatchObject([{
        link: "[[Task]]",
        text: "Task",
    }]);
})



test('Identifies a task from string that starts with hyphen', () => {
    const task = isTask('- [x] Task test text')
    expect(task).toStrictEqual(true);
    const subtask = isTask('	- [ ] Task test text')
    expect(subtask).toStrictEqual(true);
})
test('Identifies a task from string that starts with asterisk', () => {
    const task = isTask('* [ ] Task test text')
    expect(task).toStrictEqual(true);
    const subtask = isTask('	* [ ] Task test text')
    expect(subtask).toStrictEqual(true);
})
test('Identifies a task from string that starts with a number', () => {
    const task = isTask('1. [x] Task test text')
    expect(task).toStrictEqual(true);
    const subtask = isTask('	1. [x] Task test text')
    expect(subtask).toStrictEqual(true);
})
test('Identifies a task from string that starts with a big number', () => {
    const task = isTask('909999. [ ] Task test text')
    expect(task).toStrictEqual(true);
    const subtask = isTask('	909999. [ ] Task test text')
    expect(subtask).toStrictEqual(true);
})


test('Does not alter a string not identified as a task', () => {
    const task = clearTaskFormatting('Sentence that does not contain any task based markdown')
    expect(task).toEqual('Sentence that does not contain any task based markdown')
})
test('Does not alter a string that starts with hyphen', () => {
    const task = clearTaskFormatting('- Sentence that does not contain any task based markdown')
    expect(task).toEqual('- Sentence that does not contain any task based markdown')
    const subtask = clearTaskFormatting('	- Sentence that does not contain any task based markdown')
    expect(subtask).toEqual('	- Sentence that does not contain any task based markdown')
})
test('Does not alter a string that starts with asterisk', () => {
    const task = clearTaskFormatting('* Sentence that does not contain any task based markdown')
    expect(task).toEqual('* Sentence that does not contain any task based markdown')
    const subtask = clearTaskFormatting('	* Sentence that does not contain any task based markdown')
    expect(subtask).toEqual('	* Sentence that does not contain any task based markdown')
})
test('Does not alter a string that starts with a number', () => {
    const task = clearTaskFormatting('1. Sentence that does not contain any task based markdown')
    expect(task).toEqual('1. Sentence that does not contain any task based markdown')
    const subtask = clearTaskFormatting('	1. Sentence that does not contain any task based markdown')
    expect(subtask).toEqual('	1. Sentence that does not contain any task based markdown')
})
test('Does not alter a string that starts with a big number', () => {
    const task = clearTaskFormatting('909999. Sentence that does not contain any task based markdown')
    expect(task).toEqual('909999. Sentence that does not contain any task based markdown')
    const subtask = clearTaskFormatting('	909999. Sentence that does not contain any task based markdown')
    expect(subtask).toEqual('	909999. Sentence that does not contain any task based markdown')
})


test('Removes task based markdown on a string that starts with hyphen', () => {
    const task = clearTaskFormatting('- [x] Task test text')
    expect(task).toEqual('Task test text')
    const subtask = clearTaskFormatting('	- [x] Task test text')
    expect(subtask).toEqual('Task test text')
})
test('Removes task based markdown on a string that starts with asterisk', () => {
    const task = clearTaskFormatting('* [ ] Task test text')
    expect(task).toEqual('Task test text')
    const subtask = clearTaskFormatting('	* [ ] Task test text')
    expect(subtask).toEqual('Task test text')
})
test('Removes task based markdown on a string that starts with a number', () => {
    const task = clearTaskFormatting('1. [x] Task test text')
    expect(task).toEqual('Task test text')
    const subtask = clearTaskFormatting('	1. [x] Task test text')
    expect(subtask).toEqual('Task test text')
})
test('Removes task based markdown on a string that starts with a big number', () => {
    const task = clearTaskFormatting('909999. [ ] Task test text')
    expect(task).toEqual('Task test text')
    const subtask = clearTaskFormatting('	909999. [ ] Task test text')
    expect(subtask).toEqual('Task test text')
})

test('Due date priorities are correctly', () => {
    //📅📆🗓
    const dueDate = getDueDate('Task test text 📅 2023-02-01 🛫 2023-02-03 ⏳ 2023-02-02')
    expect(dueDate).toEqual('2023-02-01')

    //⏳⌛
    const scheduledDate = getDueDate('Task test text 🛫 2023-02-03 ⏳ 2023-02-02')
    expect(scheduledDate).toEqual('2023-02-02')

    //🛫
    const startDate = getDueDate('Task test text 🛫 2023-02-03')
    expect(startDate).toEqual('2023-02-03')
})


test('High priority is passed through correctly', () => {
    const priority = getPriority('Task test text ⏫')
    expect(priority).toEqual(4)
})
test('Medium priority is passed through correctly', () => {
    const priority = getPriority('Task test text 🔼')
    expect(priority).toEqual(3)
})
test('Low priority is passed through correctly', () => {
    const priority = getPriority('Task test text 🔽')
    expect(priority).toEqual(2)
})
test('No priority is passed through correctly', () => {
    const priority = getPriority('Task test text')
    expect(priority).toEqual(1)
})
test('Multiple priority passed first one through correctly', () => {
    const priority = getPriority('Task test text ⏫ 🔼 🔽 ')
    expect(priority).toEqual(4)
})


test('Priority and Duedate processing', ()=> {
    const taskText = 'Task test text 🛫 2023-02-03 ⏳ 2023-02-02 ⏫';
    const priority = getPriority(taskText)
    expect(priority).toEqual(4)
    const dueDate = getDueDate(taskText)
    expect(dueDate).toEqual('2023-02-02')
})