import { findWikiLink } from './utility';


test('test find wiki link', () => {
    expect(findWikiLink("Do this.  [[Task]]")).toMatchObject([{
        link: "[[Task]]",
        text: "Task",
    }]);
})