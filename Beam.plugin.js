//META{"name":"Beam"}*//
var Beam = function()
{
    'use strict';
    let ENABLED = false;

    /**
     * Status update interval (5min)
     * @var int
     */
    let updateInterval = (1000 * 60) * 5;
    /**
     * Status update function
     * @var function
     */
    let updateCallback = null;

    /**
     * Configuration Object
     * @var Object
     */
    let CONFIG = {
        last: null,
        active: false,
        video: false,
        users: {}
    };

    // ---------------------------------------------------------------------- //
    // Functions                                                              //
    // ---------------------------------------------------------------------- //
    function updateCheck() {
        let current = self.getVersion().split('.');
        $.get(GITHUB, function(data) {
        }, 'json').done(function(data) {
            trace(data);
            let up = data.version.split('.');
            for(let i in up) {
                if(parseInt(up[i]) > parseInt(current[i])) {
                    let str = 'A new version of ' + self.getName() + ' plugin is available, <a href="https://raw.githubusercontent.com/Nosphere/BeamPlugin/master/Beam.plugin.js" download>Download v' + data.version + '</a>';
                        str += '<h3 class="h3">Changes:</h3><ul>';
                    for(let n in data.notes.changes) {
                        str += '<li>' + data.notes.changes[n] + '</li>';
                    }
                        str += '</ul><h3 class="h5">Fixes:</h3><ul>';
                    for(let n in data.notes.fixes) {
                        str += '<li>' + data.notes.fixes[n] + '</li>';
                    }
                        str += '</ul><h3 class="h5">Known Issues:</h3><ul>';
                    for(let n in data.notes.changes) {
                        str += '<li>' + data.notes.issues[n] + '</li>';
                    }
                        str += '</ul><h3 class="h5">Special thanks:</h3><ul>';
                    for(let n in data.notes.credits) {
                        str += '<li>' + data.notes.credits[n] + '</li>';
                    }
                        str += '</ul>';
                    alert(str);
                }
            }
        }).fail(function(err) {
            trace(err);
            alert('Failed to check for updates!');
        });
    };

    /**
     * Save Plugin configuration
     */
    function save() {
        bdPluginStorage.set(self.getName(), 'config', CONFIG);
    };

    /**
     * Load Plugin configuration
     * @return Object
     */
    function load() {
        return bdPluginStorage.get(self.getName(), 'config') || CONFIG;
    };

    /**
     * Shorthand function for Core.prototype.alert
     * @param string message
     */
    function alert(message) {
        Core.prototype.alert(self.getName() + ' Plugin', '<div style="font-weight: normal;">' + message + '</div>');
    };

    /**
     * Shorthand function for console.log
     * @param mixed message
     */
    function trace(message) {
        if(typeof(message) == 'string') {
            console.log('%c[' + self.getName() + ']: ' + message, 'color: #3498db;');
        } else {
            console.log('%c[' + self.getName() + ']: ', 'color: #3498db;', message);
        }
    };

    /**
     * Attaches the beam logo button toe the discord header
     */
    function attachButton() {
        let logo = (CONFIG.active == true) ? BeamLogoActive : ((theme() == 'dark') ? BeamLogoWhite : BeamLogoBlack);
        let btn = $('<button/>', {'id': 'beam-button', 'type': 'button'});
        let img = $('<span/>', {'id': 'beam-logo'}).css({'background-image': 'url("data:image/svg+xml;base64,' + logo + '")'});

        btn.on('click', (evt) => {
            let el = $(evt.currentTarget);
            if(el.hasClass('popout-open')) {
                ClosePopup();
            } else {
                OpenPopup(el);
            }
            el.toggleClass('popout-open');
        });

        $('.header-toolbar').prepend(btn.append(img));
    };

    /**
     * Removes beam logo button
     */
    function detachButton() {
        if($('#beam-button')[0] != undefined) {
            $('#beam-button').remove();
        }
    };

    /**
     * Update beam logo on activation or theme change.
     */
    function updateButton() {
        if(ENABLED == true) {
            if($('#beam-button')[0] != undefined) {
                let logo = (CONFIG.active == true) ? BeamLogoActive : ((theme() == 'dark') ? BeamLogoWhite : BeamLogoBlack);
                $('#beam-logo').css({'background-image': 'url("data:image/svg+xml;base64,' + logo + '")'});
            } else {
                attachButton();
            }
        }
    };

    /**
     * Attaches the beam chat (and video if enabled) IFRAME to discord
     * @param int id
     */
    function attachBeam(id) {
        CONFIG.last = id || CONFIG.last;
        if(CONFIG.active && $('#beam-container')[0] == undefined) {
            let container = $('.content');
            let logo = $('<div/>', {'css': {'flex': '0 0 0%', 'min-height': '40px', 'background-repeat': 'no-repeat', 'background-attachement': 'fixed', 'background-position': 'center', 'background-color': '#0D1529', 'background-image': 'url("data:image/svg+xml;base64,' + BeamLogoText + '")'}});
            let wrapper = $('<div/>', {'id': 'beam-container', 'class': 'ui-flex flex-vertical'});
            let frame = $('<iframe/>', {'id': 'beam-chat', 'css': {'flex': '1'}});
            frame.attr('src', 'https://beam.pro/embed/chat/' + CONFIG.last);
            wrapper.append(logo, frame);
            container.append(wrapper);
            if(CONFIG.video) {
                toggleVideo();
            }
        } else if(CONFIG.active && $('#beam-container')[0] != undefined) {
            $('#beam-chat').attr('src', 'https://beam.pro/embed/chat/' + CONFIG.last);
            if($('#beam-video')[0] != undefined) {
                $('#beam-video').attr('src', 'https://beam.pro/embed/player/' + CONFIG.last);
            }
        } else {

        }
    };

    /**
     * Remove beam IFRAME from discord
     */
    function detachBeam() {
        $('#beam-container').remove();
    };

    /**
     * Attach or detach video IFRAME to/from discord
     */
    function toggleVideo() {
        if($('#beam-container')[0] != undefined) {
            if($('#beam-video')[0] != undefined) {
                $('#beam-video').remove();
            } else {
                let frame = $('<iframe/>', {'id': 'beam-video', 'css': {'height': '25%'}});
                frame.attr('src', 'https://beam.pro/embed/player/' + CONFIG.last);
                $('#beam-container').append(frame);
            }
        }
    };

    /**
     * Searches for an user using Beam API
     * @param string name
     * @param jQuery el
     */
    function searchUser(name, el) {
        if(CONFIG.users[name] == undefined) {
            let o = el.css('outline-color'); el.css('outline-color', '#f1c40f');
            let url = beamApi.replace('@s', name);
            $.get(url, (data) => {
            }, 'json').done((data) => {
                if(data.length == 0) {
                    alert('Failed to find user ' + name);
                    el.css('outline-color', '#e74c3c');
                } else {
                    addUser(data[0]);
                    el.css('outline-color', '#2ecc71');
                }
            }).fail((err) => {
                trace(err);
            });

            setTimeout(() => {
                el.css('outline-color', o).val('');
            }, 2200);
        }
    };

    /**
     * Add a user to the CONFIG.users object
     * @param Object
     */
    function addUser(user) {
        if(CONFIG.users[user.user.username] == undefined) {
            CONFIG.users[user.user.username] = {
                id: user.id,
                name: user.user.username,
                avatar: user.user.avatarUrl || 'https://beam.pro/_latest/assets/images/main/avatars/default.jpg',
                title: user.name,
                online: user.online,
                partner: user.partnered,
                featured: user.featured
            };

            if($('#beam-popout-scroller')[0] != undefined) {
                $('#beam-popout-scroller').prepend(Card(CONFIG.users[user.user.username]));
            }
            trace('Added user ' + user.user.username);
            save();
        }
    };

    /**
     * Remove user from CONFIG.users object
     * @param string name
     */
    function removeUser(name) {
        if(CONFIG.users[name] != undefined) {
            delete CONFIG.users[name];
            if($('#beam-popout-scroller')[0] != undefined) {
                $('.message-group[data-id="' + name + '"]').remove();
            }
            trace('Removed user ' + name);
            save();
        }
    };

    /**
     * Check all users status
     */
    function updateUsers() {
        trace('Checking online status');
        let users = Object.keys(CONFIG.users).join(';');
        let url = beamApi.replace('@s', users);
        $.get(url, (data) => {
            for(var i in data) {
                if(data[i] == undefined) {
                    trace(data);
                }
                CONFIG.users[data[i].user.username].avatar = data[i].user.avatarUrl || 'https://beam.pro/_latest/assets/images/main/avatars/default.jpg';
                CONFIG.users[data[i].user.username].title = data[i].name;
                CONFIG.users[data[i].user.username].online = data[i].online;
                CONFIG.users[data[i].user.username].featured = data[i].featured;
                CONFIG.users[data[i].user.username].partner = data[i].partnered;
            }
        }, 'json').fail((err) => {
            trace('Failed to update users status');
        });
    };

    // ---------------------------------------------------------------------- //
    // Discord UI methods                                                     //
    // ---------------------------------------------------------------------- //
    /**
     * Tries to get used discord theme
     * @return string
     */
    function theme() {
        if($('div[class*="theme-"]:not(".app")')[0] == undefined) {
            return 'dark';
        } else {
            return $('div[class*="theme-"]:not(".app")').attr('class').replace('theme-', '');
        }
    };

    /**
     * Open plugin popup
     * @param jQuery el
     */
    function OpenPopup(el) {
        let popout = Popup('Streamers', 'beam-popout');
        $('div[class*="theme-"]:not(".app")').append(popout);
        popout.css({
            top: el.offset().top + el.height(),
            left: el.offset().left - (popout.width() - el.width())
        });
        $('.app').on('mouseup', ClosePopup);
    };

    /**
     * Close plugin popup
     */
    function ClosePopup() {
        $('#beam-popout').remove();
        $('.app').off('mouseup', ClosePopup);
        save();
    };

    /**
     * Creates a popup element using disocrd theme
     * @param string title
     * @param string id
     * @return jQuery
     */
    function Popup(title, id) {
        id = id || self.getName() + '-popup-container';
        let container = $('<div/>', {'id': id, 'class': 'popout popout-bottom-right no-arrow no-shadow', 'css': {}});
        let wrapper = $('<div/>', {'class': 'messages-popout-wrap themed-popout undefined', 'css': {'max-height': '480px'}});
        let header = $('<div/>', {'class': 'header'})
        let text = $('<div/>', {'class': 'title'}).text(title);
        //let controls = $('<div/>', 'css': {'flex': '0 0 0%'});
        let thm = (theme() == 'dark') ? 'dark' : '';
        let scrollerWrap = $('<div/>', {'class': 'scroller-wrap ' + thm});
        let scroller = $('<div/>', {'id': id + '-scroller', 'class': 'scroller messages-popout'});

        let search = Input((e) => {
            if(e.which == 13) {
                let name = $(e.target).val();
                searchUser(name, $(e.target));
            }
        });

        let enable = Toggle('Enable', CONFIG.active, (e) => {
            CONFIG.active = e.target.checked;
            if(CONFIG.active) {
                attachBeam();
            } else {
                detachBeam();
            }

            updateButton();
        });

        let video = Toggle('Video', CONFIG.video, (e) => {
            CONFIG.video = e.target.checked;
            toggleVideo();
        });

        for(name in CONFIG.users) {
            scroller.append(Card(CONFIG.users[name]));
        }

        wrapper.append(
            header.append(text),
            search,
            enable,
            video,
            scrollerWrap.append(scroller)
        );
        container.append(wrapper);
        return container;
    };

    /**
     * Creates a textbox input using discord style
     * @param function callback
     */
    function Input(callback) {
        let container = $('<div/>', {'class': 'search-bar-icon ui-flex flex-horizontal', 'css': {'flex': '0 0 0%', 'width': 'auto', 'margin': '10px 10px 0px 10px'}});
        let clr = (theme() == 'dark') ? 'rgba(255,255,255, 0.7)' : 'rgba(0,0,0, 0.7)';
        let input = $('<input/>', {'id': 'beam-search-streamer', 'placeholder': 'Search...', 'class': 'ui-input-button default', 'css': {'flex': '1 1 auto', 'font-weight': 'inherit', 'font-size': 'inherit', 'color': clr, 'padding-left': '5px'}});
        if(callback != undefined) {
            input.on('keyup', callback);
        }

        container.append(input);
        return container;
    };

    /**
     * Creates a toggle using discord theme
     * @param string title
     * @param bool checked
     * @param function callback
     */
    function Toggle(title, checked, callback) {
        checked = checked || false;
        let container = $('<div/>', {'class': 'ui-flex flex-horizontal', 'css': {'flex': '0 0 0%', 'margin': '3px 10px'}});
        let text = $('<h3/>', {'class': 'ui-form-title h5 ui-flex-child'}).text(title);
        let label = $('<label/>', {'class': 'ui-switch-wrapper ui-flex-child'});
        let checkbox = $('<input/>', {'type': 'checkbox', 'checked': checked, 'class': 'ui-switch-checkbox'});
        let button = $('<div/>', {'class': 'ui-switch'});

        if(callback != undefined) {
            checkbox.on('change', callback);
        }

        label.append(checkbox, button);
        container.append(text, label);

        return container;
    };

    /**
     * Create a user card using discord theme
     * @param object user
     */
    function Card(user) {
        let online = (user.online == true) ? 'online' : 'invisible';
        let container = $('<div/>', {'data-id': user.name, 'class': 'channel-members message-group hide-overflow', 'css': {'max-width': '100%', 'cursor': 'pointer'}});
        let avatar = $('<div/>', {'class': 'avatar-small', 'css': {'background-image': 'url("' + user.avatar + '")'}});
        let status = $('<div/>', {'class': 'status status-' + online});
        let comment = $('<div/>', {'class': 'comment'});
        let text = $('<div/>', {'class': 'message'});
        let buttons = $('<div/>', {'class': 'action-buttons'});
        let btnDelete = $('<span/>', {'class': 'close-button'}).click(() => { removeUser(user.name) });

        text.html('<div class="body"><h2><span class="username-wrapper"><strong class="user-name">' + user.name + '</strong></span><span class="timestamp"><a href="http://beam.pro/' + user.name + '" target="_blank">beam.pro</a></h2><div class="message-text"><div class="markup">' + user.title + '</div></div></div>');

        if(user.partner == true) {
            let partner = $('<div/>', {'class': 'jump-button', 'css': {'background': '#8150EF', 'color': 'white'}}).text('Partner');
            buttons.prepend(partner);
        }

        if(user.featured == true) {
            let feat = $('<div/>', {'class': 'jump-button', 'css': {'background': '#f1c40f', 'color': 'white'}}).text('Featured');
            buttons.prepend(feat);
        }

        avatar.append(status);
        comment.append(text);
        buttons.append(btnDelete);
        container.append(avatar, comment, buttons);

        comment.on('mouseup', (e) => {
            CONFIG.last = user.id;
            attachBeam();
        });

        return container;
    };

    // ---------------------------------------------------------------------- //
    // Better Discord event methods                                           //
    // ---------------------------------------------------------------------- //
    this.observer = (evt) => {
        updateButton();
        if(CONFIG.active) {
            if($('#beam-container')[0] == undefined && $('.content')[0] != undefined) {
                attachBeam();
            }
        }
    };

    this.load = () => {
        updateCheck();
        CONFIG = load();
        attachButton();
    };

    this.unload = () => {

    };

    this.start = () => {
        updateCallback = setInterval(updateUsers, updateInterval);
        if(CONFIG.active) {
            attachBeam();
        }
        ENABLED = true;
    };

    this.stop = () => {
        if(updateCallback != null) {
            clearInterval(updateCallback);
            updateCallback = null;
        }
        ENABLED = false;
        save();
    };

    /**
     * @return string
     */
    this.getName = () => {
        return 'Beam';
    };

    /**
     * @return string
     */
    this.getDescription = () => {
        return 'Attaches beam.pro chat and video into discord.';
    };

    /**
     * @return string
     */
    this.getAuthor = () => {
        return 'Ve';
    };

    /**
     * @return string
     */
    this.getVersion = () => {
        return '0.2.4';
    };

    // ---------------------------------------------------------------------- //
    // CONSTANTS                                                              //
    // ---------------------------------------------------------------------- //
    const self = this;
    const GITHUB = 'https://raw.githubusercontent.com/Nosphere/BeamPlugin/master/version.json';
    const beamApi = 'https://beam.pro/api/v1/channels?where=token:in:@s&fields=id,name,online,partnered,featured,user';
    const BeamLogoWhite = 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyMS4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHZpZXdCb3g9IjAgMCAxMTYgMTE2IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAxMTYgMTE2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KCS5zdDB7ZmlsbDojRkZGRkZGO30NCjwvc3R5bGU+DQo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNTgsOEMzMC4zODU3NjcsOCw4LDMwLjM4NTc2MSw4LDU4czIyLjM4NTc2Nyw1MCw1MCw1MHM1MC0yMi4zODU3NjUsNTAtNTBTODUuNjE0MjQzLDgsNTgsOHoNCgkgTTEwNC44MjQyNTcsNjIuMDg1NTk0QzgxLjExOTY5LDUzLjc3OTEyOSw2Mi4yNTQyNjUsMzQuOTc2OTMzLDUzLjkxNDAzMiwxMS4xNzU3NzYNCglDODMuMDI5MTIxLDguNjY4MzM4LDEwNy4zMzMxOTEsMzIuOTQ5NjA4LDEwNC44MjQyNTcsNjIuMDg1NTk0eiBNNDMuODU3ODY4LDQzLjg1Nzg2OA0KCWM3LjgxMDQ4Ni03LjgxMDQ5MywyMC40NzM3ODItNy44MTA0OTMsMjguMjg0MjY3LDBzNy44MTA0ODYsMjAuNDczNzgyLDAsMjguMjg0MjY3cy0yMC40NzM3ODIsNy44MTA0ODYtMjguMjg0MjY3LDANCglTMzYuMDQ3MzgyLDUxLjY2ODM1NCw0My44NTc4NjgsNDMuODU3ODY4eiBNMTEuMTc1NzY5LDUzLjkxNDA5M2MyMy43MDUzMjYsOC4zMDY2NzUsNDIuNTY5NTYxLDI3LjEwOTA0Nyw1MC45MDk4NTUsNTAuOTEwMTY0DQoJQzMyLjkzNDY5NiwxMDcuMzM0NTg3LDguNjY5NjE1LDgzLjAxNTQyNywxMS4xNzU3NjksNTMuOTE0MDkzeiIvPg0KPC9zdmc+';

    const BeamLogoBlack = 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyMS4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHZpZXdCb3g9IjAgMCAxMTYgMTE2IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAxMTYgMTE2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8cGF0aCBkPSJNNTgsOEMzMC4zODU3NjcsOCw4LDMwLjM4NTc2MSw4LDU4czIyLjM4NTc2Nyw1MCw1MCw1MHM1MC0yMi4zODU3NjUsNTAtNTBTODUuNjE0MjQzLDgsNTgsOHogTTEwNC44MjQyNTcsNjIuMDg1NTk0DQoJQzgxLjExOTY5LDUzLjc3OTEyOSw2Mi4yNTQyNjUsMzQuOTc2OTMzLDUzLjkxNDAzMiwxMS4xNzU3NzZDODMuMDI5MTIxLDguNjY4MzM4LDEwNy4zMzMxOTEsMzIuOTQ5NjA4LDEwNC44MjQyNTcsNjIuMDg1NTk0eg0KCSBNNDMuODU3ODY4LDQzLjg1Nzg2OGM3LjgxMDQ4Ni03LjgxMDQ5MywyMC40NzM3ODItNy44MTA0OTMsMjguMjg0MjY3LDBzNy44MTA0ODYsMjAuNDczNzgyLDAsMjguMjg0MjY3DQoJcy0yMC40NzM3ODIsNy44MTA0ODYtMjguMjg0MjY3LDBTMzYuMDQ3MzgyLDUxLjY2ODM1NCw0My44NTc4NjgsNDMuODU3ODY4eiBNMTEuMTc1NzY5LDUzLjkxNDA5Mw0KCWMyMy43MDUzMjYsOC4zMDY2NzUsNDIuNTY5NTYxLDI3LjEwOTA0Nyw1MC45MDk4NTUsNTAuOTEwMTY0QzMyLjkzNDY5NiwxMDcuMzM0NTg3LDguNjY5NjE1LDgzLjAxNTQyNywxMS4xNzU3NjksNTMuOTE0MDkzeiIvPg0KPC9zdmc+';

    const BeamLogoActive = 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyMS4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHZpZXdCb3g9IjAgMCAxMTYgMTE2IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAxMTYgMTE2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KCS5zdDB7ZmlsbDojODE1MEVGO30NCgkuc3Qxe2ZpbGw6IzREOTBGNDt9DQoJLnN0MntmaWxsOiMyRjJGNUQ7fQ0KCS5zdDN7ZmlsbDojRkZGRkZGO30NCgkuc3Q0e2ZpbGw6IzNGNjFCNzt9DQoJLnN0NXtmaWxsOiM1NjMxQzA7fQ0KCS5zdDZ7ZmlsbDojQjVCNUM0O30NCjwvc3R5bGU+DQo8Zz4NCgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDIuMzEzNTQ1LDczLjY5MzQxM2M5LjM1NTEyOSw5LjM1NTI1NSwxNi4xMjk3OTEsMjAuMzczMjMsMjAuMTA3MDU5LDMyLjExMTQwNA0KCQljMjIuOTgxMjA1LTIuMDk4NTg3LDQxLjI3ODU5MS0yMC4zOTU4NTksNDMuMzc3MzY5LTQzLjM3NzAwM2MtMTEuNzM4MjA1LTMuOTc3MjkxLTIyLjc1Njc5OC0xMC43NTE5MTktMzIuMTEyLTIwLjEwNzIzOQ0KCQlMNDIuMzEzNTQ1LDczLjY5MzQxM3oiLz4NCgk8cGF0aCBjbGFzcz0ic3QxIiBkPSJNNzMuNjg1OTc0LDQyLjMyMDU3NmwtMC4wMDAwMDgtMC4wMDAwMDRjLTkuMzU1MTQ4LTkuMzU1Mjc0LTE2LjEyOTU2Mi0yMC4zNzM4NS0yMC4xMDY4LTMyLjExMjExOA0KCQljLTIyLjk4MTI0MywyLjA5ODU1Mi00MS4yNzg2ODcsMjAuMzk1ODQ3LTQzLjM3NzQ3Miw0My4zNzcwMjljMTEuNzM4MjEsMy45NzczNDEsMjIuNzU2NjI2LDEwLjc1MjU3NSwzMi4xMTE4NTEsMjAuMTA3OTIyDQoJCXYwLjAwMDAwOEw3My42ODU5NzQsNDIuMzIwNTc2eiIvPg0KCQ0KCQk8ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgwLjcwNzEwMiAtMC43MDcxMTEgMC43MDcxMTEgMC43MDcxMDIgLTI0LjAyOTQwNiA1OC4wMDI0MDMpIiBjbGFzcz0ic3QyIiBjeD0iNTcuOTk5NzUyIiBjeT0iNTguMDA2OTk2IiByeD0iMjIuMDQyMDM4IiByeT0iMjIuMDQyMDM4Ii8+DQoJPHBhdGggY2xhc3M9InN0MyIgZD0iTTYyLjQyNDA0OSwxMDUuODA0NDg5QzU0LjE2OTIyLDgxLjI4MjAzNiwzNC43NzA2MTUsNjEuODUyMDQ3LDEwLjIwMjAyNiw1My41ODIwMTINCgkJQzcuNDY2OTEyLDgzLjUwNzA4LDMyLjQ3OTA2OSwxMDguNTQxMTk5LDYyLjQyNDA0OSwxMDUuODA0NDg5eiIvPg0KCTxwYXRoIGNsYXNzPSJzdDQiIGQ9Ik01My45MTU3NzEsMTEuMTgyNDQ4Yy0wLjM0MTkwOC0wLjk2NzkyNi0wLjY2NDc0OS0xLjk0MDk0OC0wLjk2ODMxMS0yLjkxODU1NQ0KCQlDMjkuNDQ3NjQxLDEwLjU2MTM0NywxMC41NTc4NzMsMjkuNDI0MTI0LDguMjU3NDk4LDUyLjk1MzgwNGMwLjk3NzQ5OSwwLjMwMzUzNSwxLjk1MDQxNCwwLjYyNjM1LDIuOTE4MjM1LDAuOTY4MjM5DQoJCUMxMy4xMjk4OTcsMzEuMjIzNDIxLDMxLjIxNzA4NywxMy4xMzYzODUsNTMuOTE1NzcxLDExLjE4MjQ0OHoiLz4NCgk8cGF0aCBjbGFzcz0ic3QzIiBkPSJNNTMuNTc1NzI5LDEwLjIwODc4MmM4LjI1NDc5OSwyNC41MjI0NjEsMjcuNjUzMzU4LDQzLjk1MjQ0Miw1Mi4yMjE5MjQsNTIuMjIyNDk2DQoJCUMxMDguNTMyODUyLDMyLjUwNTcxOCw4My41MjAwMTIsNy40NzIyMDgsNTMuNTc1NzI5LDEwLjIwODc4MnoiLz4NCgk8cGF0aCBjbGFzcz0ic3Q1IiBkPSJNMTA3Ljc0MjM3OCw2My4wNTk1MTdjLTAuOTc3NTI0LTAuMzAzNTQ3LTEuOTUwNDc4LTAuNjI2MzY2LTIuOTE4MzI3LTAuOTY4MjYyDQoJCWMtMS45NTQxNzgsMjIuNjk4NTkzLTIwLjA0MTMxMyw0MC43ODU1OTktNDIuNzM5OTU2LDQyLjczOTU3OGMwLjM0MTkyNywwLjk2Nzk0MSwwLjY2NDc4LDEuOTQwOTg3LDAuOTY4MzQ5LDIuOTE4NjE3DQoJCUM4Ni40NzM3NzgsMTA1LjQ1OTY5NCwxMDUuNDM0OTE0LDg2LjY2MzQxNCwxMDcuNzQyMzc4LDYzLjA1OTUxN3oiLz4NCgk8cGF0aCBjbGFzcz0ic3Q2IiBkPSJNMTA3Ljc0MjI2NCw2My4wNTk4NzJjMy4xNjI4OC0zMS41MTkwNi0yMy4yODU5MzQtNTcuOTU3NTItNTQuNzk0OTE0LTU0Ljc5NTYyNA0KCQljMC4zMDMzMjIsMC45ODA5MDEsMC42MjQ2ODcsMS45NTM5MTgsMC45NjMwMzksMi45MTg5OWMyOS4wNjk3NzUtMi41MDU2MjksNTMuNDI5MzI1LDIxLjcyNDU3MSw1MC45MTMxMDUsNTAuOTEzNjYyDQoJCUMxMDUuNzg4NDE0LDYyLjQzNTE3NywxMDYuNzYxMzQ1LDYyLjc1NjUzMSwxMDcuNzQyMjY0LDYzLjA1OTg3MnoiLz4NCgk8cGF0aCBjbGFzcz0ic3Q2IiBkPSJNNjMuMDUyNDQ0LDEwNy43NDk0NTFjLTAuMzAzMzMzLTAuOTgwOTE5LTAuNjI0MzIxLTEuOTU0MDAyLTAuOTYyNjg1LTIuOTE5MDk4DQoJCWMtMjkuMTIzNDMyLDIuNTEwNDI5LTUzLjQyNDk2MS0yMS43ODA5MjItNTAuOTEzNTM2LTUwLjkxNDAwOWMtMC45NjQ4ODItMC4zMzgyNjQtMS45Mzc4MzgtMC42NTkyMS0yLjkxODcyNi0wLjk2MjU0DQoJCUM1LjA5OTUzOSw4NC40MjQ3MTMsMzEuNDg2MjU4LDExMC45MTcxMTQsNjMuMDUyNDQ0LDEwNy43NDk0NTF6Ii8+DQo8L2c+DQo8L3N2Zz4NCg==';
    const BeamLogoText = 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMzY2IDExNiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMzY2IDExNjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+LnN0MHtmaWxsOiNGRkZGRkY7fS5zdDF7ZmlsbDojODE1MEVGO30uc3Qye2ZpbGw6IzREOTBGNDt9LnN0M3tmaWxsOiMyRjJGNUQ7fTwvc3R5bGU+PHBhdGggY2xhc3M9InN0MCIgZD0iTTE3NS40NDk5OTcsMjRjLTkuNSwwLTQzLDAtNDMsMGw0LjUsMTEuOTAwMDAyaDIuODk5OTk0VjkyaDM2YzcuODk5OTk0LDAsMTIuMTAwMDA2LTQuMzAwMDAzLDEyLjEwMDAwNi0xMi40MDAwMDJWNjcuNWMwLTMuMzAwMDAzLTAuNjk5OTk3LTUuNS0yLjEwMDAwNi03Yy0xLjE5OTk5Ny0xLjI5OTk5OS0yLjg5OTk5NC0yLTUuMzAwMDAzLTIuMjk5OTk5bC01LjY5OTk5Ny0wLjc5OTk5OWw1LjMwMDAwMy0xLjI5OTk5OWM2LjM5OTk5NC0xLjQwMDAwMiw3LTUuNSw3LTkuNzAwMDAxYzAsMCwwLTQuOTAwMDAyLDAtMTAuNVMxODQuOTQ5OTk3LDI0LDE3NS40NDk5OTcsMjR6IE0xNzMuNjQ5OTk0LDc3LjVjLTAuMTAwMDA2LDEuNTk5OTk4LTEuMTAwMDA2LDIuNS0yLjY5OTk5NywyLjVoLTE2Ljg5OTk5NGwwLjEwMDAwNi0xNy4yOTk5OTljMCwwLDEzLjYwMDAwNiwwLDE2LjUsMHMzLDIuNDAwMDA1LDMsMi45OTk5OTZMMTczLjY0OTk5NCw3Ny41eiBNMTcyLjg0OTk5MSwzOC45MDAwMDJjMCwxLjc5OTk5OSwwLDEwLjA5OTk5OCwwLDEwLjA5OTk5OGMwLDEuNTk5OTk4LTAuODk5OTk0LDIuNTk5OTk4LTIuNSwyLjU5OTk5OGgtMTYuMTk5OTk3VjM1LjkwMDAwMmMwLDAsMTMuODk5OTk0LDAsMTUuODAwMDAzLDBDMTcxLjg0OTk5MSwzNS45MDAwMDIsMTcyLjg0OTk5MSwzNywxNzIuODQ5OTkxLDM4LjkwMDAwMnoiLz48cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjQzLjU1MDAxOCw5MmwyMS43OTk5ODgtNTYuMDk5OTc2bDEwLjUsMjYuODk5OTYzaC0xM2wtNC4yMDAwMTIsMTEuMTAwMDM3aDIxLjVMMjg3LjI1MDAzMSw5MmgyMVY0NC4yMDAwMTJsMTYuMTk5OTUxLDI0LjA5OTk3Nmg1bDE2LjQwMDAyNC0yNC4wOTk5NzZWOTJoMTIuMDk5OTc2VjI0aC0xMmwtMTkuMDk5OTc2LDI4bC0xOC41LTI4SDI5NS43NjAwNHY1NS45MzY0MDFMMjczLjU1MDAxOCwyNGgtMTcuMjAwMDEybC0yMS42MTQ5OSw1Ni4wOTk5MTVMMjA0LjY0OTk5NCw4MGwtMC4wOTk5NzYtMTcuMjk5OTg4aDIzLjc5OTk4OFY1MS41OTk5NzZoLTIzLjkwMDAyNGwtMC4wOTk5NzYtMTUuNjk5OTUxaDMwLjI5OTk4OFYyNGgtMzljLTIuODk5OTYzLDAtNSwyLjA5OTk3Ni01LDQuOTAwMDI0Vjg1YzAsMy41OTk5NzYsMy4yOTk5ODgsNi43OTk5ODgsNi45MDAwMjQsN0gyNDMuNTUwMDE4eiIvPjxnPjxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik00Mi4zMTM1OTEsNzMuNjg2ODgyYzkuODcwMTEsOS44NzAyMzIsMTYuODY4NDE2LDIxLjU5MTEzMywyMC43Mzg5NzksMzQuMDU2MTE0YzIzLjY4MDQ3LTIuMzE1MTQsNDIuMzc1MDExLTIxLjAwOTMzMSw0NC42OTAxMDUtNDQuNjkwMTA1Qzk1LjI3Nzg0LDU5LjE4MjI3OCw4My41NTYzNTgsNTIuMTg0MDQ4LDczLjY4NjI0OSw0Mi4zMTM4Mkw0Mi4zMTM1OTEsNzMuNjg2ODgyeiIvPjxwYXRoIGNsYXNzPSJzdDIiIGQ9Ik03My42ODYyNDksNDIuMzEzODJsLTAuMDAwMDA4LTAuMDAwMDA4Yy05Ljg3MDEwNi05Ljg3MDIzNS0xNi44NjgxMy0yMS41OTE3Ny0yMC43Mzg2OTMtMzQuMDU2NzUxQzI5LjI2NzA3OCwxMC41NzIxOTUsMTAuNTcyNTI1LDI5LjI2NjM2OSw4LjI1NzQyMSw1Mi45NDcxNGMxMi40NjQ4MjEsMy44NzA2MTMsMjQuMTg2MDY4LDEwLjg2OTQ5OSwzNC4wNTYxNjgsMjAuNzM5NzM1djAuMDAwMDA4TDczLjY4NjI0OSw0Mi4zMTM4MnoiLz48ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgwLjcwNzEwMiAtMC43MDcxMTEgMC43MDcxMTEgMC43MDcxMDIgLTI0LjAyNDY2IDU4LjAwMDU2OCkiIGNsYXNzPSJzdDMiIGN4PSI1Ny45OTk5MTYiIGN5PSI1OC4wMDAzNTEiIHJ4PSIyMi4wNDIxOTgiIHJ5PSIyMi4wNDIxOTgiLz48cGF0aCBjbGFzcz0ic3QwIiBkPSJNNTIuOTQ3NTQ4LDguMjU3MDYyYzguMDY3MzQxLDI2LjA4ODQwMiwyOC42NTQ0MTEsNDYuNzEyMTA5LDU0Ljc5NTEyOCw1NC43OTU4M0MxMTAuOTA3MDk3LDMxLjUxNzc3OCw4NC40Mzk1OSw1LjA5Njg4NSw1Mi45NDc1NDgsOC4yNTcwNjJ6Ii8+PHBhdGggY2xhc3M9InN0MCIgZD0iTTYzLjA1MjU3LDEwNy43NDI5OTZDNTQuOTg1MjM3LDgxLjY1NDU4NywzNC4zOTgxNCw2MS4wMzA4NjEsOC4yNTc0MjEsNTIuOTQ3MTRDNS4wOTE3MDIsODQuNDk1NDUzLDMxLjU3MTYyMywxMTAuOTAyMDMxLDYzLjA1MjU3LDEwNy43NDI5OTZ6Ii8+PC9nPjwvc3ZnPg==';
};
