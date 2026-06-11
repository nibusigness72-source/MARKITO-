function toggleIssueList() {
    const list = document.getElementById('my-issue-list');
    list.style.display = (list.style.display === 'none') ? 'block' : 'none';
}

function handleVote(id) {
    let element = document.getElementById(id);
    let currentVal = parseInt(element.innerText);
    element.innerText = currentVal + 1;
    alert("शुक्रिया! आपकी प्रतिक्रिया दर्ज कर ली गई है।");
}
