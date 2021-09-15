/*
    A simple jQuery TopTips (http://github.com/wwhyes/jquery-toptips)
    Version 0.0.1
*/

(function (factory) {
  // Making your jQuery plugin work better with npm tools
  // http://blog.npmjs.org/post/112712169830/making-your-jquery-plugin-work-better-with-npm
  if(typeof module === 'object' && typeof module.exports === 'object') {
    factory(require('jquery'), window, document)
  }
  else {
    factory(jQuery, window, document)
  }
}(function($, window, document, undefined) {

  var toptips = []
  var getCurrent = function() {
    return toptips.length ? toptips[toptips.length - 1] : null
  }
  var selectCurrent = function() {
    var selected = false
    for (var i = toptips.length-1; i >= 0; i--) {
      if (toptips[i].$blocker) {
        toptips[i].$blocker.toggleClass('current', !selected).toggleClass('behind', selected)
        selected = true
      }
    }
  }

  $.toptips = function(options) {
    this.$body = $('body')
    this.options = $.extend({}, $.toptips.defaults, options)
    this.options.doFade = !isNaN(parseInt(this.options.fadeDuration, 10))
    this.$blocker = null
    if (this.options.closeExisting) {
      while ($.toptips.isActive())
        $.toptips.close() // Close any open toptips.
    }
    toptips.push(this)
    
    this.$elm = $(`<div class="toptips">
      <div class="toptips__icon"></div>
      <pre class="toptips__message">${options.message}</pre>
    </div>`)
    this.$body.append(this.$elm)
    this.open()
  }

  $.toptips.prototype = {
    constructor: $.toptips,

    open: function() {
      var m = this
      this.block()
      if(this.options.doFade) {
        setTimeout(function() {
          m.show()
        }, this.options.fadeDuration * this.options.fadeDelay)
      } else {
        this.show()
      }
      $(document).off('keydown.toptips').on('keydown.toptips', function(event) {
        var current = getCurrent()
        if (event.which === 27 && current.options.escapeClose) current.close()
      })
      if (this.options.clickClose)
        this.$blocker.click(function(e) {
          if (e.target === this)
            $.toptips.close()
        })
    },

    close: function() {
      toptips.pop()
      this.unblock()
      this.hide()
      if (!$.toptips.isActive())
        $(document).off('keydown.toptips')
    },

    block: function() {
      this.$elm.trigger($.toptips.BEFORE_BLOCK, [this._ctx()])
      this.$blocker = $('<div class="' + this.options.blockerClass + ' current"></div>').appendTo(this.$body)
      selectCurrent()
      if(this.options.doFade) {
        this.$blocker.css('opacity', 0).animate({ opacity: 1 }, this.options.fadeDuration)
      }
      this.$elm.trigger($.toptips.BLOCK, [this._ctx()])
    },

    unblock: function(now) {
      if (!now && this.options.doFade) {
        this.$blocker.fadeOut(this.options.fadeDuration, this.unblock.bind(this, true))
      } else {
        // this.$blocker.children().appendTo(this.$body)
        this.$blocker.remove()
        this.$blocker = null
        selectCurrent()
      }
    },

    show: function() {
      this.$elm.trigger($.toptips.BEFORE_OPEN, [this._ctx()])
      if (this.options.showClose) {
        this.closeButton = $('<a href="#close-toptips" rel="toptips:close" class="toptips__close"></a>')
        this.$elm.append(this.closeButton)
      }
      this.$elm.addClass(this.options.type).appendTo(this.$blocker)
      if(this.options.doFade) {
        this.$elm.css({ opacity: 0 }).animate({ opacity: 1 }, this.options.fadeDuration)
      }
      this.$elm.trigger($.toptips.OPEN, [this._ctx()])
    },

    hide: function() {
      this.$elm.trigger($.toptips.BEFORE_CLOSE, [this._ctx()])
      if (this.closeButton) this.closeButton.remove()
      var _this = this
      if(this.options.doFade) {
        this.$elm.fadeOut(this.options.fadeDuration, function () {
          _this.$elm.trigger($.toptips.AFTER_CLOSE, [_this._ctx()])
        })
      } else {
        this.$elm.hide(0, function () {
          _this.$elm.trigger($.toptips.AFTER_CLOSE, [_this._ctx()])
        })
      }
      this.$elm.trigger($.toptips.CLOSE, [this._ctx()])
    },

    //Return context for custom events
    _ctx: function() {
      return { elm: this.$elm, $elm: this.$elm, $blocker: this.$blocker, options: this.options }
    }
  }

  $.toptips.close = function(event) {
    if (!$.toptips.isActive()) return
    if (event) event.preventDefault()
    var current = getCurrent()
    current && current.close()
    return current.$elm
  }

  // Returns if there currently is an active toptips
  $.toptips.isActive = function () {
    return toptips.length > 0
  }

  $.toptips.getCurrent = getCurrent

  $.toptips.defaults = {
    message: '',
    type: 'info', // ['info', 'success', 'warning', 'error']
    closeExisting: true,
    escapeClose: true,
    clickClose: true,
    blockerClass: "toptips-container",
    showClose: true,
    fadeDuration: 200,   // Number of milliseconds the fade animation takes.
    fadeDelay: 1.0        // Point during the overlay's fade-in that the toptips begins to fade in (.5 = 50%, 1.5 = 150%, etc.)
  }

  // Event constants
  $.toptips.BEFORE_BLOCK = 'toptips:before-block'
  $.toptips.BLOCK = 'toptips:block'
  $.toptips.BEFORE_OPEN = 'toptips:before-open'
  $.toptips.OPEN = 'toptips:open'
  $.toptips.BEFORE_CLOSE = 'toptips:before-close'
  $.toptips.CLOSE = 'toptips:close'
  $.toptips.AFTER_CLOSE = 'toptips:after-close'

  $.fn.toptips = function(options){
    if (this.length === 1) {
      new $.toptips(this, options)
    }
    return this
  }

  // Automatically bind links with rel="toptips:close" to, well, close the toptips.
  $(document).on('click.toptips', 'a[rel~="toptips:close"]', $.toptips.close)
  $(document).on('click.toptips', 'a[rel~="toptips:open"]', function(event) {
    event.preventDefault()

    var option = $(this).data()
    new $.toptips(option)
  })
}))
