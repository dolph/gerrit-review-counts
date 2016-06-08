// ==UserScript==
// @name         Gerrit: review counts
// @version      0.2
// @description  Adds review counts to Gerrit dashboards.
// @iconURL      https://review.openstack.org/favicon.ico
// @icon64URL    https://upload.wikimedia.org/wikipedia/commons/4/4d/Gerrit_icon.svg
// @author       Dolph Mathews
// @namespace    https://github.com/dolph/gerrit-review-counts
// @match        http*://review.openstack.org/*
// @match        http*://review.gerrithub.io/*
// @grant        Apache License 2.0
// ==/UserScript==

function render_change_count(sectionHeader, changeCount) {
    // Find the change count, if one exists, so we can update it.
    var changeCountsSpan = sectionHeader.getElementsByClassName('changeCount')[0];
    if (changeCountsSpan === undefined) {
        // Create a new change count.
        changeCountsSpan = document.createElement('span');
        changeCountsSpan.className = 'changeCount';
        sectionHeader.appendChild(changeCountsSpan);
    }
    
    // Update the change count, accounting for the non-plural case.
    changeCountsSpan.innerHTML = ' (' + changeCount + ' change' + (changeCount != 1 ? 's' : '') + ')';
}

function count_reviews() {
    var changeTable = document.getElementsByClassName('changeTable')[0];
    if (changeTable === undefined) {
        // There's nothing to do in this frame.
        console.log('No changeTable found.');
        return;
    }
    var rows = changeTable.getElementsByTagName('tr');
    var lastSectionHeader = null;
    var changeCount = -1; // Start at -1 to account for the column headers that are mysteriously not in a <thead>
    for(var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var sectionHeaders = row.getElementsByClassName('sectionHeader');
        if (sectionHeaders.length !== 0 && lastSectionHeader !== null) {
            // We just iterated over a section, and we've come to a new section, so update the change count of the last section we iterated over.
            render_change_count(lastSectionHeader, changeCount);
            changeCount = 0;
        }
        if (sectionHeaders.length !== 0) {
            // We've come to a new section, store a reference to it for a later iteration.
            lastSectionHeader = sectionHeaders[0];
        } else if (row.getElementsByClassName('emptySection').length == 1) {
            // This is an empty section, so no need to increment our change counter.
        } else {
            // This row represents a change, so increment our counter.
            changeCount++;
        }
    }

    // Go back and update the last section we encountered with the remaining change count
    render_change_count(lastSectionHeader, changeCount);
}

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observer = new MutationObserver(function(mutations, observer) {
    var span = $('table.changeTable');
    $.each(mutations, function(i, mutation) {
        if (mutation.addedNodes.length !== 0) {
            var newNode = mutation.addedNodes[0];
            // Divs seem to be the last thing added to each row, so test for that (I wish there was something better to test for?).
            if (Object.prototype.toString.call(newNode) == '[object HTMLDivElement]') {
                count_reviews();
            }
        }
    });
});

// We only care to observe when new nodes are added somewhere into the table.
observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: false,
    characterData: false
});
