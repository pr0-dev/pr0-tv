// ==UserScript==
// @name        Pr0-TV
// @author      TheShad0w
// @include     https://*pr0gramm.com*
// @exclude     https://full.pr0gramm.com*
// @exclude     https://pr0gramm.com/static/
// @version     1.0.0
// @description Fügt den Pr0 TV wieder hinzu
// @icon        https://pr0gramm.com/media/pr0gramm-favicon.png
// @grant       unsafeWindow
// @run-at      document-end
// ==/UserScript==

function init(){
    p.View.TV = p.View.TV || {};

    p.View.TV.Channel = p.View.Base.extend({
        template: ' <div class="tv-video-container"></div>' +
                  ' <canvas class="tv-animation"></canvas>' +
                  ' <div class="tv-overlay">' +
                  ' <img src="https://raw.githubusercontent.com/pr0-dev/pr0-tv/master/media/tv-frame-left.png" class="tv-frame-left"/>' +
                  ' <img src="https://raw.githubusercontent.com/pr0-dev/pr0-tv/master/media/tv-frame-right.png" class="tv-frame-right"/>' +
                  ' <img src="https://raw.githubusercontent.com/pr0-dev/pr0-tv/master/media/tv-frame-center.png" class="tv-frame-center"/>' +
                  ' <svg viewBox="0 0 75 75" class="tv-muted"> <polygon class="audio-speaker" points="39.389,13.769 22.235,28.606 6,28.606 6,47.699 21.989,47.699 39.389,62.75 39.389,13.769"/> <g> <path d="M 49,50 69,26"/> <path d="M 69,50 49,26"/> </g> </svg>' +
                  ' <div class="tv-channel-indicator"></div> </div>' +
                  ' <div class="tv-remote-container"> <div class="tv-remote">' +
                  ' <img src="https://raw.githubusercontent.com/pr0-dev/pr0-tv/master/media/remote.png" class="tv-remote-background"/>' +
                  ' <a class="tv-remote-banner" href="http://pr0gramm.com"></a>' +
                  ' <div class="tv-remote-button tv-remote-button-1" data-num="1" data-channel="news"></div>' +
                  ' <div class="tv-remote-button tv-remote-button-2" data-num="2" data-channel="kevin"></div>' +
                  ' <div class="tv-remote-button tv-remote-button-3" data-num="3" data-channel="animal"></div>' +
                  ' <div class="tv-remote-button tv-remote-button-4" data-num="4" data-channel="earthporn"></div>' +
                  ' <div class="tv-remote-button tv-remote-button-5" data-num="5" data-channel="shit"></div>' +
                  ' <div class="tv-remote-button tv-remote-button-6" data-num="6" data-channel="porn"></div>' +
                  ' <div class="tv-remote-button tv-remote-button-7" data-num="7" data-channel="top"></div>' +
                  ' <div class="tv-remote-button tv-remote-button-8" data-num="8" data-channel="sport"></div>' +
                  ' <div class="tv-remote-button tv-remote-button-mute" data-channel="mute"></div> </div> </div> ',
        title: "Pr0 TV",
        images: {},
        loadQueue: 0,
        channel: 'earthporn',
        currentIndex: 0,
        $nextVideo: null,
        $currentVideo: null,
        remoteVisible: false,
        muted: true,
        channels: {
            porn: {
                promoted: 1,
                flags: 2,
                tags: '! video'
            },
            kevin: {
                promoted: 1,
                flags: 1,
                tags: '! video & (verdient | kevin | peng | \'dumm ist wer dummes tut\')'
            },
            earthporn: {
                promoted: 1,
                flags: 1,
                tags: '! video & (natur | earthporn | erderotik)'
            },
            sport: {
                promoted: 1,
                flags: 1,
                tags: '! video & (kann ich auch | der hat doch an | fick nicht mit dem ficker | asiatensachen | weg zur uni)'
            },
            animal: {
                promoted: 1,
                flags: 1,
                tags: '! video & (kadse | bellkadse | kefer | flauschität | haustier)'
            },
            news: {
                promoted: 1,
                flags: 1,
                tags: '! video & (pol | politik | nachrichten)'
            },
            shit: {
                promoted: 0,
                flags: 1,
                tags: '! s:shit & video & -repost'
            },
            top: {
                promoted: 1,
                flags: 1,
                tags: '! s:4000 & video & -pol'
            }
        },
        firstChannel: 'kevin',
        firstChannelNum: 2,
        show: function(params) {
            document.title = 'Pr0 TV';
            $('html, body').addClass('tv');
            this.parent(params);
            this.$videoContainer = $('.tv-video-container');
            $('.tv-remote-button').click(this.clickChannel.bind(this));
            this.canvas = $('canvas.tv-animation')[0];
            this.canvas.width = 512;
            this.canvas.height = 288;
            this.ctx = this.canvas.getContext('2d');
            this.images.noise = this.loadImage('https://raw.githubusercontent.com/pr0-dev/pr0-tv/master/media/noise.png');
            this.images.vignette = this.loadImage('https://raw.githubusercontent.com/pr0-dev/pr0-tv/master/media/vignette.png');
            this.images.scanlines = this.loadImage('https://raw.githubusercontent.com/pr0-dev/pr0-tv/master/media/scanlines.jpg');
            if (typeof document.hidden !== 'undefined') {
                this.visibilityChangeBound = this.visibilityChange.bind(this);
                document.addEventListener('visibilitychange', this.visibilityChangeBound, false);
            }
            if (p.mobile) {
                var viewport = document.querySelector("meta[name=viewport]");
                viewport.setAttribute('content', 'width=1200, user-scalable=1,initial-scale=1.0');
                $('.tv-overlay').click(this.toggleRemote.bind(this));
                $('.tv-remote-banner').remove();
            }
            this.resizeBound = this.resize.bind(this);
            $(window).resize(this.resizeBound);
            this.resize();
        },
        toggleRemote: function(ev) {
            this.remoteVisible = !this.remoteVisible;
            if (this.remoteVisible) {
                $('.tv-remote').stop(true, false).animate({
                    'bottom': 0
                });
            } else {
                $('.tv-remote').stop(true, false).animate({
                    'bottom': -340
                });
            }
            ev.preventDefault();
            return false;
        },
        clickChannel: function(ev) {
            var button = $(ev.currentTarget).data('channel');
            if (button === 'mute') {
                this.muted = !this.muted;
                this.$container.find('.tv-muted').toggle(this.muted);
                if (this.$currentVideo) {
                    this.$currentVideo[0].muted = this.muted;
                    this.$currentVideo[0].volume = this.muted ? 0 : 1;
                }
                if (this.$nextVideo) {
                    this.$nextVideo[0].muted = this.muted;
                    this.$nextVideo[0].volume = this.muted ? 0 : 1;
                }
                return;
            }
            this.$container.find('.tv-channel-indicator').text($(ev.currentTarget).data('num'));
            clearInterval(this.introInterval);
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            $(this.canvas).show();
            setTimeout(this.switchChannel.bind(this, button), 50);
        },
        switchChannel: function(channel) {
            clearInterval(this.introInterval);
            $(this.canvas).show();
            this.introInterval = setInterval(this.renderIntro.bind(this), 16);
            this.channel = channel;
            if (this.channel === 'porn' && !p.user.id) {
                return;
            }
            setTimeout(this.loadChannel.bind(this, this.channelLoaded.bind(this)), 250);
        },
        loadChannel: function(callback) {
            var c = this.channels[this.channel];
            var maxId = c.promoted ? 412365 : 3077347
            var range = maxId - (c.promoted ? 300000 : 2000000);
            var timeLower = Math.floor(Date.now() / 120000) * 667;
            var older = maxId - (timeLower % range);
            var opts = {
                promoted: c.promoted,
                flags: (c.flags === 1 && p.user.id) ? 9 : c.flags,
                tags: c.tags,
                older: older
            };
            p.api.get('items.get', opts, callback);
        },
        channelReload: function(response) {
            if (response.items.length < 3) {
                return;
            }
            this.items = response.items.shuffle();
            this.currentIndex = 0;
            if (this.currentIndex > this.items.length - 2) {
                this.loadChannel(this.channelReload.bind(this));
            }
        },
        channelLoaded: function(response) {
            if (response.items.length < 5) {
                this.loadChannel(this.channelReload.bind(this));
                return;
            }
            this.items = response.items.shuffle();
            this.currentIndex = 0;
            if (this.$currentVideo) {
                this.$currentVideo[0].pause();
                this.$currentVideo.remove();
            }
            if (this.$nextVideo) {
                this.$nextVideo[0].pause();
                this.$nextVideo.remove();
            }
            this.$currentVideo = null,
            this.$nextVideo = null;
            this.nextVideo();
        },
        nextVideo: function() {
            if (this.currentIndex > this.items.length - 10) {
                this.loadChannel(this.channelReload.bind(this));
            }
            this.currentIndex = this.currentIndex % this.items.length;
            if (this.currentIndex >= this.items.length) {
                return;
            }
            if (!this.$currentVideo) {
                var src = CONFIG.PATH.IMAGES + this.items[this.currentIndex].image;
                this.currentIndex++;
                this.$currentVideo = this.createVideoElement(src, this.videoCanPlay.bind(this));
            } else {
                this.$currentVideo.remove();
                this.$currentVideo = this.$nextVideo;
                this.resize();
                this.$videoContainer.append(this.$currentVideo);
                this.playVideo();
            }
            this.$currentVideo[0].onended = this.nextVideo.bind(this);
            var src = CONFIG.PATH.IMAGES + this.items[this.currentIndex].image;
            this.currentIndex++;
            this.$nextVideo = this.createVideoElement(src);
        },
        playVideo: function() {
            this.$currentVideo[0].play();
        },
        pauseVideo: function() {
            this.$currentVideo[0].pause();
        },
        createVideoElement: function(src, loadedCallback) {
            var $vid = $('<video preload="auto" src="' + src + '" ' + (this.muted ? 'muted="muted"' : '') + '></video>');
            if (loadedCallback) {
                $vid[0].oncanplaythrough = loadedCallback;
            }
            return $vid;
        },
        videoCanPlay: function(ev) {
            clearInterval(this.introInterval);
            $(this.canvas).hide();
            this.resize();
            this.$videoContainer.append(this.$currentVideo);
            this.playVideo();
        },
        resize: function() {
            if (this.$currentVideo && this.$currentVideo[0].videoWidth) {
                var pw = 104
                  , ph = 20;
                var sw = this.$videoContainer.width() - pw
                  , sh = this.$videoContainer.height() - ph;
                var vw = this.$currentVideo[0].videoWidth
                  , vh = this.$currentVideo[0].videoHeight;
                var sa = sw / sh
                  , va = vw / vh;
                var nw = 0
                  , nh = 0;
                if (sa > va) {
                    nw = sw;
                    nh = sw / va;
                } else {
                    nw = sh * va;
                    nh = sh;
                }
                this.$currentVideo.css({
                    width: nw,
                    height: nh,
                    left: ((sw - nw) / 2 + pw / 2) | 0,
                    top: ((sh - nh) / 2 + ph / 2) | 0
                });
            }
        },
        visibilityChange: function() {
            if (!this.$currentVideo || !this.$currentVideo[0].videoWidth) {
                return;
            }
            if (document.hidden) {
                this.pauseVideo();
            } else {
                this.playVideo();
            }
        },
        remove: function() {
            $('html, body').removeClass('tv');
            $(window).unbind('resize', this.resizeBound);
            if (this.visibilityChangeBound) {
                document.removeEventListener('visibilitychange', this.visibilityChangeBound, false);
            }
            this.parent();
        },
        loadImage: function(name) {
            this.loadQueue++;
            var img = new Image();
            img.src = name;
            img.onload = this.imageLoaded.bind(this);
            return img;
        },
        imageLoaded: function() {
            this.loadQueue--;
            if (this.loadQueue === 0) {
                this.start();
            }
        },
        start: function() {
            this.introStartTime = Date.now();
            this.introInterval = setInterval(this.renderIntro.bind(this), 16);
            setTimeout(this.loadFirstChannel.bind(this), 1000);
        },
        loadFirstChannel: function() {
            $('.tv-remote').animate({
                'bottom': -340
            });
            $('.tv-remote').hover(function() {
                $(this).stop(true, false).animate({
                    'bottom': 0
                });
            }, function() {
                $(this).stop(true, false).animate({
                    'bottom': -340
                });
            });
            this.switchChannel(this.firstChannel);
            this.$container.find('.tv-channel-indicator').text(this.firstChannelNum);
        },
        renderIntro: function() {
            var elapsed = (Date.now() - this.introStartTime) / 1000;
            var ctx = this.ctx;
            var w = this.canvas.width
              , h = this.canvas.height;
            ctx.fillStyle = '#222';
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = elapsed.map(0, 2, 0, 1).limit(0, 1);
            this.fillImage(this.images.noise, (Math.random() * 512) | 0, (Math.random() * 512) | 0);
            if (this.channel === 'porn' && !p.user.id) {
                ctx.globalAlpha = 0.1;
                ctx.fillRect(0, 0, w, h);
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = '#eee'
                ctx.font = '20px sans-serif';
                ctx.fillText('Account benötigt :/', w / 2 - 80, h / 2.5);
                ctx.fillStyle = '#222';
            }
            ctx.globalAlpha = 0.2 * ctx.globalAlpha;
            ctx.globalCompositeOperation = 'lighter';
            this.fillImage(this.images.scanlines, elapsed * 10, elapsed * 100);
            ctx.globalAlpha = 0.5;
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(this.images.vignette, 0, 0, w, h);
            ctx.globalAlpha = 1;
        },
        fillImage: function(img, x, y) {
            var cw = this.ctx.canvas.width
              , ch = this.ctx.canvas.height
              , iw = img.width
              , ih = img.height;
            x = (x % iw - iw) % iw;
            y = (y % ih - ih) % ih;
            for (var nx = x; nx < cw; nx += iw) {
                for (var ny = y; ny < ch; ny += ih) {
                    this.ctx.drawImage(img, nx, ny);
                }
            }
        },
        setTitle: function() {},
        setNotificationCount: function() {}
    });

    if (p.getLocation().match(/^pr0\-tv/)) {
        p.mainView = new p.View.TV.Channel('body');
        p.mainView.show();
        p.start('#main-view');
    }
}

$(document).ready(function(){
    $('head').append(`<style type="text/css">
        body.tv, html.tv{
            height:100%;
            width:100%;
            min-width:800px;
        }

        a#pr0-tv-link{
            display: inline-block;
            height: 15px;
            width: 21px;
            margin-left: 10px;
            text-indent: -9999px;
            background: url("https://raw.githubusercontent.com/pr0-dev/pr0-tv/master/media/tv.png") center center no-repeat;
            background-size: contain;
        }

        div#main-view.tv-page{
            padding:0;
            margin:0;
            overflow:hidden;
            position:relative;
            height:100%;
            width:100%;
        }

        canvas.tv-animation{
            width:100%;
            height:100%;
            position:absolute;
            left:0;
            top:0;
            z-index:1;
            background-color:#000;
        }

        div.tv-overlay{
            position:absolute;
            left:0;
            top:0;
            width:100%;
            height:100%;
            z-index:2;
        }

        img.tv-frame-left, img.tv-frame-right, img.tv-frame-center{
            z-index:4;
            height:100%;
            position:absolute;
            top:0;
        }

        img.tv-frame-left{
            width:128px;
            left:0;
        }

        img.tv-frame-right{
            width:128px;
            right:0;
        }

        img.tv-frame-center{
            width:100%;
            padding:0 128px;
        }

        div.tv-remote{
            width:600px;
            height:441px;
            position:absolute;
            bottom:-441px;
            right:120px;
            z-index:5;
        }

        a.tv-remote-banner{
            z-index:10;
            display:block;
            position:absolute;
            left:140px;
            top:20px;
            width:320px;
            height:64px;
        }

        div.tv-remote-button{
            z-index:10;
            width:50px;
            height:40px;
            position:absolute;
            background-position:center;
            background-repeat:no-repeat;
            cursor:pointer;
        }

        div.tv-remote-button:hover{
            /**
             * Auf die hab ich vergessen :(
             * Ist leider nicht das Original sondern nur ein semi-transparentes schwarzes Bild...
             */ 
            background-image:url('https://raw.githubusercontent.com/pr0-dev/pr0-tv/master/media/remote-hover.png');
        }

        div.tv-remote-button-1{
            left:40px;
            top:126px;
        }

        div.tv-remote-button-2{
            left:95px;
            top:126px;
        }

        div.tv-remote-button-3{
            left:150px;
            top:126px;
        }

        div.tv-remote-button-4{
            left:41px;
            top:185px;
        }

        div.tv-remote-button-5{
            left:96px;
            top:185px;
        }

        div.tv-remote-button-6{
            left:150px;
            top:185px;
        }

        div.tv-remote-button-7{
            left:40px;
            top:244px;
        }

        div.tv-remote-button-8{
            left:95px;
            top:244px;
        }

        div.tv-remote-button-mute{
            left:152px;
            top:366px;
        }

        div.tv-video-container{
            width:100%;
            height:100%;
            position:relative;
            background-color:#222;
            overflow:hidden;
            position:relative;
        }

        div.tv-video-container video, div.tv-video-container canvas{
            display:block;
            position:absolute;
            margin:auto;
        }

        svg.tv-muted{
            display:block;
            left:100px;
            top:10vh;
            width:50px;
            height:50px;
            position:absolute;
            z-index:6;
            opacity:0.3;
        }

        svg.tv-muted polygon{
            fill:#fff;
            stroke:none;
        }

        svg.tv-muted path{
            stroke:#fff;
            stroke-width:5;
            fill:none;
        }

        div.tv-channel-indicator{
            display:block;
            right:100px;
            top:10vh;
            width:50px;
            height:50px;
            position:absolute;
            z-index:6;
            opacity:0.3;
            font-size:32pt;
        }
    </style>`);

    $("#head-menu").append('<a class="user-only" id="pr0-tv-link" href="/pr0-tv" title="Pr0 TV">TV</a>');

    init();
});
