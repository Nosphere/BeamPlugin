//META{"name":"Beam"}*//
/**
 * @TODO Popout should close on outside clicks.
 */
class Beam
{
    constructor() {
    }

    // #region Plugin Methods
    trace() {
        let str = '%c[' + this.getName() + ']: ';
        for(let i in arguments) {
            console.log(str, 'width:100%!important;background-color:#3498db;color:#ecf0f1;padding:2px 4px;', arguments[i]);
        }
    }

    /**
     * Shorthand function for Core.prototype.alert
     * @param string message
     */
    alert(title, str) {
        Core.prototype.alert(title, '<div style="font-weight: normal;">' + str + '</div>');
    }

    updateCheck() {
        let current = this.getVersion().split('.');
        $.get(this.github.replace('{{FILE}}', 'version.json'), {'now': $.now()} , (data) => {
        }, 'json').done((data) => {
            let up = data.version.split('.');
            for(let i in up) {
                if(parseInt(up[i]) > parseInt(current[i])) {
                    let str = 'A new version of ' + this.getName() + ' plugin is available, <a href="' + this.github.replace('{{FILE}}', this.getName() + '.plugin.js') + '" download>Download v' + data.version + '</a>';
                        str += '<h3 class="h5">To Do:</h3><ul>';
                    for(let n in data.notes.todo) {
                        str += '<li>' + data.notes.todo[n] + '</li>';
                    }
                        str += '</ul><h3 class="h5">Changes:</h3><ul>';
                    for(let n in data.notes.changes) {
                        str += '<li>' + data.notes.changes[n] + '</li>';
                    }
                        str += '</ul><h3 class="h5">Fixes:</h3><ul>';
                    for(let n in data.notes.fixes) {
                        str += '<li>' + data.notes.fixes[n] + '</li>';
                    }
                        str += '</ul><h3 class="h5">Known Issues:</h3><ul>';
                    for(let n in data.notes.issues) {
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
        }).fail((err) => {
            this.trace('Update check failed:', err);
            alert('Failed to check for updates!');
        });
    }

    /**
     * Create a toggle checkbox using Discord UI
     * @param string    title     Title for the toggle
     * @param boolean   checked   Toggle ON or offline
     * @param function  callback  Callback function on toggle event
     */
    Toggle(title, checked, callback) {
        let container = $('<div/>', {'class': 'ui-flex flex-horizontal'}),
            text      = $('<h3 />', {'class': 'ui-form-title h3 ui-flex-child'}),
            label     = $('<label/>', {'class': 'ui-switch-wrapper ui-flex-child'}),
            checkbox  = $('<input/>', {'class': 'ui-switch-checkbox', 'type': 'checkbox', 'checked': checked}),
            button    = $('<div/>', {'class': 'ui-switch'});

        if(callback !== undefined) {
            checkbox.on('change', callback);
        }

        return container.append(text.text(title), label.append(checkbox, button));
    }

    /**
     * Creates a message card using Discord UI
     * @param object user Object containing user data
     */
    Card(user) {
        let container = $('<div/>', {'class': 'channel-members message-group hide-overflow', 'css': {'max-width': '100%', 'cursor': 'pointer'}}),
            avatar    = $('<div/>', {'class': 'avatar-small', 'css': {'background-image': 'url("' + user.avatar + '")'}}),
            status    = $('<div/>', {'class': 'status status-' + ((user.online) ? 'online' : 'invisible')}),
            comment   = $('<div/>', {'class': 'comment'}),
            title     = $('<div/>', {'class': 'message'}),
            buttons   = $('<div/>', {'class': 'action-buttons'}),
            remove    = $('<span/>', {'class': 'close-button'});
            clr       = (user.featured === true) ? 'color: #1FBAED' : '';
        title.html('<div class="body"><h2><span class="username-wrapper"><strong class="user-name" style="font-size: 110%;' + clr + '">' + user.name + '</strong></span><span class="timestamp">' + user.audience + '</span></h2><div class="message-text"><div class="markup">' + user.title + '</div></div></div>');
        return container.append(
            avatar.append(status),
            comment.append(title),
            buttons.append(remove.on('click', (evt) => {
                container.remove();
                delete this.config.users[user.name];
                this.config = {save: $.now()};
            }))
        ).on('click', (evt) => {
            console.log(user);
            this.attach(user.id);
            this.popout.detach();
        });
    }

    /**
     * Create an input field using Discord UI
     * @param string    placeholder  Placeholder text
     * @param function  callback     Callback function called ONKEYUP
     */
    Input(placeholder, callback) {
        let container = $('<div/>', {'class': 'search-bar-icon ui-flex flex-horizontal', 'css': {'flex': '0 0 0%', 'width': 'auto', 'margin': '7px 5px 7px 13px'}}),
            input     = $('<input/>', {'class': 'ui-input-button default', 'css': {'flex': '1 1 auto', 'font-weight': 'inherit', 'font-size': 'inherit', 'padding-left': '6px', 'margin-right': '13px', 'color': ((this.theme == 'dark') ? 'rgba(255,255,255, 0.7)' : 'rgba(0,0,0, 0.7)')}, 'placeholder': placeholder});

        if(callback !== undefined) {
            input.on('keyup', callback);
        }
        return container.append(input);
    }

    /**
     * Attaches mixer embed container
     * @param int id
     */
    attach(id) {
        this.config.last = id || this.config.last;
        if(this.config.active) {
            $('.content').append(this.mixer);
            this.chat = this.config.last;
            if(this.config.video) {
                this.mixer.append(this.video);
                this.video = this.config.last;
            }
        }
    }

    /**
     * Removes the mixer container
     */
    detach() {
        this.mixer.remove();
    }

    /**
     * Search for a user
     * @param string name Username to search for
     * @param jQuery el   Text Input jQuery element
     */
    search(name, el) {
        if(this.config.users[name] !== undefined) {
            return;
        }

        let url = this.api.replace('{{NAME}}', name).replace('{{FIELDS}}', 'id,name,online,audience,featured,partnered,user,type');
        $.get(url, {cached: $.now()}, (data) => {
            if(data.length <= 0) {
                if(el !== undefined) {
                    el.css('outline-color', '#e74c3c').val('Failed to find ' + name);
                }
                this.trace('Failed to get user data!', err);
            } else {
                let user = {
                    id: data[0].id,
                    name: data[0].user.username,
                    title: data[0].name,
                    audience: data[0].audience,
                    featured: data[0].featured,
                    partnered: data[0].partnered,
                    online: data[0].online,
                    avatar: data[0].user.avatarUrl
                }
                this.config = {users: {[name]: user}};
                if(el !== undefined) {
                    el.css('outline-color', '#2ecc71');
                }

                $('#mixer-users').prepend(this.Card(user));
            }
        }, 'json').fail((err) => {
            if(el !== undefined) {
                el.css('outline-color', '#e74c3c').val('Failed to find ' + name);
            }
            this.trace('Failed to get user data!', err);
        });

        if(el !== undefined) {
            setTimeout(() => {
                el.css('outline-color', 'initial').val('');
            }, 2300);
        }
    }

    /**
     * Checks user status changes, default interval is 5min we don't want to spam mixer servers
     */
    check() {
        let users = Object.keys(this.config.users);
        if(users.length <= 0) {
            return;
        }

        let url = this.api.replace('{{NAME}}', users.join(';')).replace('{{FIELDS}}', 'name,online,featured,partnered,user');
        $.get(url, {cached: $.now()}, (data) => {
            this.trace("Status check:", data);
            for(let i in data) {
                let user = data[i];
                this.config = {users: {[user.user.name]: {
                    title: data.name,
                    online: data.online,
                    featured: data.featured,
                    partnered: data.partnered
                }}};
            }
        }, 'json').fail((err) => {
            this.trace('Failed to check user status!', err);
        });
    }

    /**
     * Creates user cards in the popout
     */
    list() {
        let el = $('#mixer-users');
        if(el.children().length > 0) {
            el.empty();
        }
        for(let i in this.config.users) {
            let user = this.config.users[i];
            if(this.config.offline === true && user.online === false) {
                continue;
            }
            el.append(this.Card(user));
        }
    }
    // #endregion

    // #region Property Getters and Setters
    /**
     * @return object Returns the configuration object
     */
    get config() {
        if(this._config === undefined) {
            this._config = $.extend({
                active: false,
                offline: false,
                video: false,
                last: null,
                users: {}
            }, bdPluginStorage.get(this.getName(), 'config'));
        }
        return this._config;
    }

    /**
     * Set or modify a configuration property
     *
     * ```js
     * this.config = {active: true} // will set active to true
     * ```
     * @param object o Object of the configuration proerties and values
     */
    set config(o) {
        if(typeof(o) !== 'object') {
            return this.trace('Invalid value for config setter expecting a object type, [' + typeof(o) + '] recieved!');
        }

        if(o.hasOwnProperty('users')) {
            this.config.users = $.extend(this.config.users, o.users);
            delete o.users;
        }

        this._config = $.extend(this.config, o);
        bdPluginStorage.set(this.getName(), 'config', this._config);
    }

    /**
     * @return string github URL for update check
     */
    get github() {
        return 'https://raw.githubusercontent.com/Nosphere/Mixer-Plugin/master/{{FILE}}?now=1496035380197';
    }

    /**
     * @return string Mixer api url
     */
    get api() {
        return 'https://mixer.com/api/v1/channels?where=token:in:{{NAME}}&fields={{FIELDS}}';
    }

    /**
     * @return string Mixer embed url
     */
    get embed() {
        return 'https://mixer.com/embed/{{EMBED}}/{{ID}}';
    }

    /**
     * @return jQuery returns embed container element as jQuery object
     */
    get mixer() {
        if(this._mixer === undefined) {
            this.mixer = this.config.last;
        }
        return this._mixer;
    }

    /**
     * Creates mixer embed container and sets chat and video IDs
     * @param int id User id to embed
     */
    set mixer(id) {
        this.config.last = id || this.config.last;
        if(this._mixer === undefined) {
            let container = $('<div/>', {'class': 'ui-flex flex-vertical', 'id': 'mixer-container'}),
                logo      = $('<div/>', {'css': {'min-height': '32px', 'flex': '0 0 0%', 'background-repeat': 'no-repeat', 'background-attachement': 'fixed', 'background-position': 'center', 'background-color': '#141828', 'background-image': 'url("data:image/svg+xml;base64,' + this.mixerText + '")'}});

            this._mixer = container.append(logo, this.chat.attr('src', id));
        } else {
            this.chat.attr('src', id);
            this.video.attr('src', id);
        }
    }

    /**
     * @return int Returns status check callback interval ID
     */
    get statusCheck() {
        return (this._interval === undefined) ? false : this._interval;
    }

    /**
     * Sets update check interval to {minutes}
     * @param int minutes
     */
    set statusCheck(minutes) {
        if(minutes === false) {
            clearInterval(this.statusCheck);
        } else if(this.statusCheck === false) {
            minutes = minutes || 5;
            minutes = (60 * 1000) * parseInt(minutes);
            this._interval = setInterval(() => {
                this.check()
            }, minutes);
        } else {
            clearInterval(this.statusCheck);
            this.statusCheck = minutes;
        }
    }

    /**
     * @return jQuery Popout parent element as jQuery object
     */
    get container()
    {
        if(this._container === undefined) {
            this._container = $('#app-mount > * > div[class*="theme-"]');
        }
        return this._container;
    }

    /**
     * @return jQuery Returns jQuery object for the video iframe
     */
    get video() {
        if(this._video === undefined) {
            this._video = $('<iframe/>', {'allowfullscreen': true, 'css': {'height': '25%'}});
        }
        return this._video;
    }

    /**
     * Sets the url for the video embed
     * @param int id User ID
     */
    set video(id) {
        this.video.attr('src', this.embed.replace('{{EMBED}}', 'player').replace('{{ID}}', id));
    }

    /**
     * @return jQuery Returns jQuery object for the chat iframe
     */
    get chat() {
        if(this._chat === undefined) {
            this._chat = $('<iframe/>', {'css': {'flex': '1'}});
        }
        return this._chat;
    }

    /**
     * Sets the url for the chat embed
     * @param int id User ID
     */
    set chat(id) {
        this.chat.attr('src', this.embed.replace('{{EMBED}}', 'chat').replace('{{ID}}', id));
    }


    /**
     * Get theme name
     * @returns string Tries to get discord theme, LIGHT or DARK
     */
    get theme() {
        let el = $('div[class*="theme-"]:not(".app")');
        return (el[0] === undefined) ? 'dark' : el.attr('class').replace('theme-', '');
    }

    /**
     * Get Discord toolbar element as jQuery object
     * @return jQuery
     */
    get toolbar() {
        if(this._toolbar === undefined) {
            this._toolbar = $('.header-toolbar');
        }
        return $('.header-toolbar');
    }

    /**
     * Get Button element as jQuery object
     * @return jQuery
     */
    get button() {
        if(this._button === undefined) {
            let container = $('<button/>', {'id': 'mixer-button', 'type': 'button', 'css': {'order': '-1'}}),
                img       = $('<span/>', {'css': {'background-image': 'url("data:image/svg+xml;base64,' + this.logo + '")'}});
            this._button = container.append(img);
        }
        return this._button;
    }

    /**
     * Set button image/icon
     * @param string i Base64 SVG image string
     */
    set button(i) {
        this.button.children().eq(0).css('background-image', 'url("data:image/svg+xml;base64,' + i + '")');
    }

    /**
     * Get popout element as jQuery object
     * @return jQuery
     */
    get popout() {
        if(this._popout === undefined) {
            this.popout = this.getName();
        }
        return this._popout;
    }

    /**
     * Create popout element
     * ```js
     * this.popout = "Title"; // Will create the element if there is not one already
     * ```
     * @param string title
     */
    set popout(title) {
        if(this._popout === undefined) {
            let container = $('<div/>', {'class': 'popout'}),
                wrapper   = $('<div/>', {'class': 'messages-popout-wrap themed-popout undefined'}),
                header    = $('<div/>', {'class': 'header'}),
                scrlWrap  = $('<div/>', {'class': 'scroller-wrap ' + ((this.theme == 'dark') ? 'dark' : ''), 'css': {'max-height': '385px'}}),
                scroller  = $('<div/>', {'class': 'scroller messages-popout', 'id': 'mixer-users'}),
                options   = $('<div/>', {'css': {'padding': '4px 13px 4px 13px', 'box-sizing': 'border-box'}});

            wrapper.append(
                header.append(this.Toggle(title, this.config.active, (evt) => {
                    this.config = {active: evt.target.checked};
                    this.button = this.logo;
                    if(this.config.active === true) {
                        this.attach();
                    } else {
                        this.detach();
                    }
                })),
                this.Input('Search...', (evt) => {
                    if(evt.which === 13) {
                        $(evt.target).css('outline-color', '#f39c12');
                        this.search(evt.target.value, $(evt.target));
                    }
                }),
                options.append(
                    this.Toggle('Video', this.config.video, (evt) => {
                        this.config = {video: evt.target.checked};
                        if(this.config.video === true && $('#mixer-container')[0] !== undefined) {
                            this.mixer.append(this.video);
                        } else if(this.config.video === false && $('#mixer-container')[0] !== undefined) {
                            this.video.remove();
                        }
                    }).css('margin-bottom', '4px'),
                    this.Toggle('Offline', this.config.offline, (evt) => {
                        this.config = {offline: evt.target.checked};
                        this.list();
                    })
                ),
                scrlWrap.append(scroller)
            );

            this._popout = container.append(wrapper);
        }
    }
    // #endregion

    // #region BetterDiscord Event methods
    observer() {
        this.button = this.logo;
        if($('#mixer-button')[0] === undefined && this.toolbar[0] !== undefined) {
            this.toolbar.prepend(this.button);
        }

        if(this.config.users.length > 0 && this.config.last === null) {
            this.config.last = this.config.users[Object.keys(this.config.users)[0]].id;
        }

        if(this.config.active && $('#mixer-container')[0] === undefined) {
            this.attach();
        } else if(this.config.active === false && $('#mixer-container')[0] !== undefined) {
            this.detach();
        }
    }

    load() {
        this.updateCheck();
    }

    unload() {

    }

    /**
     *
     */
    start() {
        this.toolbar.prepend(this.button.on('click', (evt) => {
            evt.preventDefault();
            if(this.popout.parent()[0] === undefined) {
                let e = $(evt.target);
                this.container.append(this.popout);
                this.popout.css({
                    top: e.offset().top + e.height(),
                    left: e.offset().left - (this.popout.width() - e.width())
                });
                this.list();
            } else {
                this.popout.detach();
            }
        }));

        this.statusCheck = 5;
    }

    stop() {
        this.button.detach();
        this.detach();
        this.statusCheck = false;
        this.config = {save: $.now()};
    }

    // #endregion

    // #region BetterDiscord getters
    getName() {
        return this.constructor.name;
    }

    getDescription() {
        return "Attaches Mixer.com chat and optionally video directly to discord, enabling stream participation from within discord.";
    }

    getAuthor() {
        return "Ve";
    }

    getVersion() {
        return '0.2.9';
    }
    // #endregion

    // #region Mixer Logo Base64 string getters
    get logo() {
        if(this.config.active === true) {
            return this.mixerActive;
        } else if(this.theme === 'dark') {
            return this.mixerWhite;
        } else {
            return this.mixerBlack;
        }
    }

    get mixerBlack() {
        return 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyIDUxMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxwYXRoIGQ9Ik0xMTYuMDMsNzcuNjhjLTE1Ljc2LTIxLjI5LTQ2LjcyLTI0LjYxLTY2LjkxLTYuMzZjLTE3LjQyLDE2LjA0LTE4LjgsNDMuMTMtNC43LDYyLjIxbDkwLjk2LDEyMS45Mkw0My44NywzNzguNDhjLTE0LjEsMTkuMDgtMTIuOTksNDYuMTcsNC43LDYyLjIxYzIwLjE4LDE4LjI1LDUxLjE1LDE0LjkzLDY2LjkxLTYuMzZsMTI3LjczLTE3MS42OWMzLjA0LTQuMTUsMy4wNC05Ljk1LDAtMTQuMUwxMTYuMDMsNzcuNjh6Ii8+PHBhdGggZD0iTTM5Ni4zNyw3Ny42OGMxNS43Ni0yMS4yOSw0Ni43Mi0yNC42MSw2Ni45MS02LjM2YzE3LjQyLDE2LjA0LDE4LjgsNDMuMTMsNC43LDYyLjIxbC05MC45NiwxMjEuOTJsOTEuNTEsMTIzLjAzYzE0LjEsMTkuMDgsMTIuOTksNDYuMTctNC43LDYyLjIxYy0yMC4xOCwxOC4yNS01MS4xNSwxNC45My02Ni45MS02LjM2TDI2OS40NywyNjIuMzZjLTMuMDQtNC4xNS0zLjA0LTkuOTUsMC0xNC4xTDM5Ni4zNyw3Ny42OHoiLz48L3N2Zz4=';
    }

    get mixerWhite() {
        return 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyIDUxMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+LnN0MHtmaWxsOiNGRkZGRkY7fTwvc3R5bGU+PHBhdGggY2xhc3M9InN0MCIgZD0iTTExNi4wMyw3Ny42OGMtMTUuNzYtMjEuMjktNDYuNzItMjQuNjEtNjYuOTEtNi4zNmMtMTcuNDIsMTYuMDQtMTguOCw0My4xMy00LjcsNjIuMjFsOTAuOTYsMTIxLjkyTDQzLjg3LDM3OC40OGMtMTQuMSwxOS4wOC0xMi45OSw0Ni4xNyw0LjcsNjIuMjFjMjAuMTgsMTguMjUsNTEuMTUsMTQuOTMsNjYuOTEtNi4zNmwxMjcuNzMtMTcxLjY5YzMuMDQtNC4xNSwzLjA0LTkuOTUsMC0xNC4xTDExNi4wMyw3Ny42OHoiLz48cGF0aCBjbGFzcz0ic3QwIiBkPSJNMzk2LjM3LDc3LjY4YzE1Ljc2LTIxLjI5LDQ2LjcyLTI0LjYxLDY2LjkxLTYuMzZjMTcuNDIsMTYuMDQsMTguOCw0My4xMyw0LjcsNjIuMjFsLTkwLjk2LDEyMS45Mmw5MS41MSwxMjMuMDNjMTQuMSwxOS4wOCwxMi45OSw0Ni4xNy00LjcsNjIuMjFjLTIwLjE4LDE4LjI1LTUxLjE1LDE0LjkzLTY2LjkxLTYuMzZMMjY5LjQ3LDI2Mi4zNmMtMy4wNC00LjE1LTMuMDQtOS45NSwwLTE0LjFMMzk2LjM3LDc3LjY4eiIvPjwvc3ZnPg==';
    }

    get mixerActive() {
        return 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyIDUxMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+LnN0MHtmaWxsOiMwMzIxNEY7fS5zdDF7ZmlsbDojMUZCQUVEO308L3N0eWxlPjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xMTYuMDMsNzcuNjhjLTE1Ljc2LTIxLjI5LTQ2LjcyLTI0LjYxLTY2LjkxLTYuMzZjLTE3LjQyLDE2LjA0LTE4LjgsNDMuMTMtNC43LDYyLjIxbDkwLjk2LDEyMS45Mkw0My44NywzNzguNDhjLTE0LjEsMTkuMDgtMTIuOTksNDYuMTcsNC43LDYyLjIxYzIwLjE4LDE4LjI1LDUxLjE1LDE0LjkzLDY2LjkxLTYuMzZsMTI3LjczLTE3MS42OWMzLjA0LTQuMTUsMy4wNC05Ljk1LDAtMTQuMUwxMTYuMDMsNzcuNjh6Ii8+PHBhdGggY2xhc3M9InN0MSIgZD0iTTM5Ni4zNyw3Ny42OGMxNS43Ni0yMS4yOSw0Ni43Mi0yNC42MSw2Ni45MS02LjM2YzE3LjQyLDE2LjA0LDE4LjgsNDMuMTMsNC43LDYyLjIxbC05MC45NiwxMjEuOTJsOTEuNTEsMTIzLjAzYzE0LjEsMTkuMDgsMTIuOTksNDYuMTctNC43LDYyLjIxYy0yMC4xOCwxOC4yNS01MS4xNSwxNC45My02Ni45MS02LjM2TDI2OS40NywyNjIuMzZjLTMuMDQtNC4xNS0zLjA0LTkuOTUsMC0xNC4xTDM5Ni4zNyw3Ny42OHoiLz48L3N2Zz4=';
    }

    get mixerText() {
        return 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgNzEyIDIyMCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNzEyIDIyMDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+LnN0MHtmaWxsOiNGRkZGRkY7fS5zdDF7ZmlsbDojMUZCQUVEO308L3N0eWxlPjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yNTcsNjcuM2MtOSwwLTE2LjQsNy4zLTE2LjQsMTYuNHYxMTcuN2MwLDIuNCwxLjksNC4zLDQuMyw0LjNoMjQuMmMyLjQsMCw0LjMtMS45LDQuMy00LjNWODMuN0MyNzMuNCw3NC42LDI2Ni4xLDY3LjMsMjU3LDY3LjMiLz48cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTY5LjQsNjcuNGMtMjAuMSwwLTM0LDguMy00NC4zLDI0LjJjLTEzLjctMzIuNC02MC40LTMxLjctNzkuOC0xLjlDNDIuMyw3NywzMSw2Ny42LDE3LjUsNjcuNmgtNC4xYzAsMjUuMSwwLDEwNC44LDAsMTMzLjhjMCwyLjQsMS45LDQuMyw0LjMsNC4zaDI0LjJjMi40LDAsNC4zLTEuOSw0LjMtNC4zVjEzMGMwLTE4LDguNi0zNS40LDI2LjQtMzUuNGMxNi42LDAsMjQuNiwxMC42LDI0LjYsMzIuNHY3NC4zYzAsMi40LDEuOSw0LjMsNC4zLDQuM2gyNC4yYzIuNCwwLDQuMy0xLjksNC4zLTQuM1YxMzBjMC0xNy4xLDkuNi0zNS40LDI2LjQtMzUuNGMyMC43LDAsMjQuOSwxNCwyNC45LDM1djcxLjhjMCwyLjQsMS45LDQuMyw0LjMsNC4zaDI0LjNjMi40LDAsNC4zLTEuOSw0LjMtNC4zdi03OC44QzIxNC4xLDg5LjIsMjAyLjMsNjcuNCwxNjkuNCw2Ny40Ii8+PHBhdGggY2xhc3M9InN0MCIgZD0iTTMyOS41LDczLjVjLTUuNy03LjctMTYuOS04LjktMjQuMi0yLjNjLTYuMyw1LjgtNi44LDE1LjYtMS43LDIyLjVsMzIuOSw0NC4xbC0zMy4xLDQ0LjVjLTUuMSw2LjktNC43LDE2LjcsMS43LDIyLjVjNy4zLDYuNiwxOC41LDUuNCwyNC4yLTIuM2w0Ni4yLTYyLjFjMS4xLTEuNSwxLjEtMy42LDAtNS4xTDMyOS41LDczLjV6Ii8+PHBhdGggY2xhc3M9InN0MSIgZD0iTTQzMC45LDczLjVjNS43LTcuNywxNi45LTguOSwyNC4yLTIuM2M2LjMsNS44LDYuOCwxNS42LDEuNywyMi41bC0zMi45LDQ0LjFsMzMuMSw0NC41YzUuMSw2LjksNC43LDE2LjctMS43LDIyLjVjLTcuMyw2LjYtMTguNSw1LjQtMjQuMi0yLjNMMzg1LDE0MC4zYy0xLjEtMS41LTEuMS0zLjYsMC01LjFMNDMwLjksNzMuNXoiLz48cGF0aCBjbGFzcz0ic3QxIiBkPSJNNTE5LDEwMi4yYzUuNy01LjcsMTIuNC04LjYsMjAuMS04LjZjOC40LDAsMTUsMi42LDE5LjcsNy44YzQuNCw1LDYuOCwxMi4yLDcsMjEuNmgtNTcuM0M1MTAuMSwxMTQuNiw1MTMuNywxMDcuNiw1MTksMTAyLjIgTTU3Mi4xLDE4MC4yYy0xLTEuMy0yLjctMS44LTQuMi0xLjNjMCwwLDAsMCwwLDBjLTE3LjEsNS45LTU2LjYsOS40LTU5LjUtMzAuNmg3NS42YzguMSwwLDE0LjYtNi41LDE0LjYtMTQuNmMwLTE4LjEtMy4zLTM1LjYtMTUuNi00OS4xYy0zMC4xLTMzLjMtMTA4LjItMjAuNy0xMDguMiw1NC44YzAsNzguMyw3My4yLDc2LjYsMTA2LjQsNjEuNGMyLjUtMS4xLDMuMi00LjMsMS42LTYuNEw1NzIuMSwxODAuMnoiLz48cGF0aCBjbGFzcz0ic3QxIiBkPSJNNjk3LjUsNjkuNEw2OTcuNSw2OS40Yy01LjgtMS42LTE1LjItMS4yLTE4LjItMC42Yy0xMS43LDMuNS0yMC4zLDExLjUtMjUuNSwyMy42Yy0xLjgtMTQtMTMuOC0yNC44LTI4LjMtMjQuOGgtNC4yYzAsMjUuMSwwLDEwNC45LDAsMTMzLjhjMCwyLjQsMS45LDQuMyw0LjMsNC4zaDI0LjJjMi40LDAsNC4zLTEuOSw0LjMtNC4zdi02NC44YzAtMjYuOCwxNS4xLTQ1LjYsNDAuNy0zNi4xYzIuOCwxLDUuOC0xLDUuOC00VjczLjZDNzAwLjcsNzEuNyw2OTkuMyw2OS45LDY5Ny41LDY5LjQiLz48cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjM5LjUsMjYuNWMwLDkuNyw3LjksMTcuNSwxNy42LDE3LjVzMTcuNS03LjksMTcuNS0xNy41UzI2Ni43LDksMjU3LDlTMjM5LjUsMTYuOSwyMzkuNSwyNi41Ii8+PC9zdmc+';
    }
    // #endregion
}
