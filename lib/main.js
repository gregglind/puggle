/*

Puggle, a simplified browser interface, for kids.

License:  MPL2

*/

const {Cu} = require("chrome");

const {PageMod} = require("page-mod");
const tabs = require("tabs");
const windows = require("windows").browserWindows;
const windowUtils = require("window-utils");

// Modules - Page Thumbnailer, and the "addon:newtab" page utils
const { NewTabUtils } = Cu.import("resource://gre/modules/NewTabUtils.jsm");
const { PageThumbs } = Cu.import("resource://gre/modules/PageThumbs.jsm");


/* Build a 'default list' of sites for the about:newtab page */

// CRITICAL!  the url has to have '/' and be legit for PageThumbs to see it right
// (no redirects or such)
var linksList = [];

for each (let pair in [['wikipedia', 'wikipedia.com'],
['Nick!','nick.com'], ['baby animals!','zooborns.com'],
['lego', 'http://www.lego.com/en-us/default.aspx'], ['sesame street', 'pbskids.org'],
['minecrafting', 'minecraft.net'], ['discovery', 'kids.discovery.com'],
['ponies', 'http://www.hubworld.com/my-little-pony/shows/friendship-is-magic/'],
['geographic','http://kids.nationalgeographic.com/kids/']]) {
    let url = pair[1];
    if (! (pair[1].indexOf('/') > -1)) { url = "http://" + url + "/"; }
    linksList.push({url:url, title:pair[0]})
}


/*  For our purposes, overriding `links._provider` with an object with a 
    getLinks(callback) -> list of {url:url, title:title} objects 
    
    ex:  {url: "http://www.mozilla.org/", title: "Mozilla"}
    
    Normally, this list would come from some function of history or bookmarks or such
*/
NewTabUtils.links._provider = {getLinks: function(callback) { callback(linksList)}};
NewTabUtils.links._provider.getLinks(function(x){console.log(JSON.stringify(x))});


/*  our walled garden of okay sites.  TODO, implement */
var whitelist = [];  // url patterns that are fine!


// Listen for tab openings.  Hackish and slow.  TODO change to frame switching?
// this is robust to all methods of tab opening.  'ready' has url, 'open' does not.
tabs.on('ready', function onActivate(tab) {
  if (tab === tabs[0]) return true;
  
  //console.log("trying to open tab at:", tab.url);
  tabs[0].activate();
  tabs[0].url = tab.url;
  tab.close();
});



/*  TURN OFF THE CHROME.

Hiding the toolbars is so bizarro world that it needs its own article!

if you just use <toolbar>.hidden = true  on the <nav-bar>
it causes history to completely break.
Possible reason:  there is some hidden `div` ('Browser:Back') that is critical.

Thus, we need to use the *right* 'hidingAttribute', as shown at:

See rev 29181 Bug 456535 - On Windows, users should be able to hide the menubar and show it with the alt key.

*/
var uiTracker = new windowUtils.WindowTracker({
    onTrack: function(window) {
        if ("chrome://browser/content/browser.xul" != window.location) return;
        //var backBroadcaster = window.document.getElementById("Browser:Back");
        //console.log("DISABLED?",backBroadcaster.hasAttribute("disabled"));

        //https://developer.mozilla.org/en/DOM/window.locationbar
        //DONT GO THIS WAY:  window.locationbar.visible = false;

        for (let pair in Iterator(window.document.getElementsByTagName('tabs'))) 
        { 
            console.log('got one!');
            //pair[1].hidden=true;
        }
        /*info: got one! toolbar-menubar
        info: got one! nav-bar
        info: got one! PersonalToolbar
        info: got one! TabsToolbar
        info: got one! devtools-sidebar-toolbar
        info: got one! inspector-toolbar
        info: got one! addon-bar
        */
        for (let pair in Iterator(window.document.getElementsByTagName('toolbar'))) 
        { 
            var id = pair[1].id;
            let toolbar = pair[1];
            // we like the inspector bars for now.
            if (id == "inspector-toolbar" || id == "devtools-sidebar-toolbar" ) {
                continue;
            };
            
            if (id == "TabsToolbar") {
                toolbar.hidden=true;  // This one needs heavier iron.
            } else {
                let hidingAttribute = toolbar.getAttribute("type") == "menubar" ?
                                "autohide" : "collapsed";
                console.log('got one!', pair[1].id);
                console.log('hiding attribute:', hidingAttribute);
                toolbar.setAttribute(hidingAttribute,true)
            }
        }
        // WARN: This way will ruin history / navigation
        // window.toolbar.visible = false;

        
        return true;
    }
});



/* set up the about:newtab page with different defaults?  
Inspector is a great help here.
    
    http://mxr.mozilla.org/mozilla-central/source/browser/modules/NewTabUtils.jsm
    http://mxr.mozilla.org/mozilla-central/source/browser/base/content/newtab/newTab.xul

*/
var aboutNewtab = PageMod({
   include: "about:newtab",
   contentStyle: [
        // !important matters here to push up into the Chrome.
        "#newtab-margin-top {display: none !important;}",
        ".newtab-cell {-moz-margin-end: 0px !important; border:0px !important}",
        ".newtab-side-margin {display: none !important;}",
        "#newtab-margin-bottom {display: none !important;}",
        "#newtab-toggle {display: none !important;}",
        ".newtab-thumbnail { background-color:pink !important; }",
        ".newtab-row {margin-bottom: 0px !important;}",
        "#newtab-grid {background-color: purple !important;}"
   ]
});
/*  TODO:  Explore 'glass' / clear ui?
? glass -- you'd need to unset the default background-color on the tabbrowser?  Mook_as
12:02 < Mook_as> gregglind: IIRC, it was set to be not-transparent because otherwise it was slower for <something>
*/   


// actually open it!  
tabs.open('about:newtab');

console.log("Puggle completed startup.");


