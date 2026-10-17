export const listNotes = (notes) => {
    notes.forEach(({ id, content, tags }) => {
        const tagList = (tags || [])
            .map((tag) => tag.trim())
            .filter(Boolean)
            .join(', ');

        console.log('--------------------');
        console.log('id: ', id);
        console.log('tags: ', tagList || '(none)');
        console.log('note: ', content);
        console.log('--------------------');
        console.log('\n');
    });
};
