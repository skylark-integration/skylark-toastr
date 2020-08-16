/**
 * skylark-toastr - A version of toastr.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-toastr/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-toastr/toastr',[
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "skylark-domx-query",
    "skylark-domx-data",
    "skylark-domx-geom",
    "skylark-domx-styler",
    "skylark-domx-eventer"
], function (skylark,langx,$) {
    var $container;
    var listener;
    var toastId = 0;
    var toastType = {
        error: 'error',
        info: 'info',
        success: 'success',
        warning: 'warning'
    };

    var toastr = {
        clear: clear,
        remove: remove,
        error: error,
        getContainer: getContainer,
        info: info,
        options: {},
        subscribe: subscribe,
        success: success,
        version: '2.1.4',
        warning: warning
    };

    var previousToast;


    ////////////////

    function error(message, title, optionsOverride) {
        return notify({
            type: toastType.error,
            iconClass: getOptions().iconClasses.error,
            message: message,
            optionsOverride: optionsOverride,
            title: title
        });
    }

    function getContainer(options, create) {
        if (!options) { options = getOptions(); }
        $container = $('#' + options.containerId);
        if ($container.length) {
            return $container;
        }
        if (create) {
            $container = createContainer(options);
        }
        return $container;
    }

    function info(message, title, optionsOverride) {
        return notify({
            type: toastType.info,
            iconClass: getOptions().iconClasses.info,
            message: message,
            optionsOverride: optionsOverride,
            title: title
        });
    }

    function subscribe(callback) {
        listener = callback;
    }

    function success(message, title, optionsOverride) {
        return notify({
            type: toastType.success,
            iconClass: getOptions().iconClasses.success,
            message: message,
            optionsOverride: optionsOverride,
            title: title
        });
    }

    function warning(message, title, optionsOverride) {
        return notify({
            type: toastType.warning,
            iconClass: getOptions().iconClasses.warning,
            message: message,
            optionsOverride: optionsOverride,
            title: title
        });
    }

    function clear($toastElement, clearOptions) {
        var options = getOptions();
        if (!$container) { getContainer(options); }
        if (!clearToast($toastElement, options, clearOptions)) {
            clearContainer(options);
        }
    }

    function remove($toastElement) {
        var options = getOptions();
        if (!$container) { getContainer(options); }
        if ($toastElement && $(':focus', $toastElement).length === 0) {
            removeToast($toastElement);
            return;
        }
        if ($container.children().length) {
            $container.remove();
        }
    }

    // internal functions

    function clearContainer (options) {
        var toastsToClear = $container.children();
        for (var i = toastsToClear.length - 1; i >= 0; i--) {
            clearToast($(toastsToClear[i]), options);
        }
    }

    function clearToast ($toastElement, options, clearOptions) {
        var force = clearOptions && clearOptions.force ? clearOptions.force : false;
        if ($toastElement && (force || $(':focus', $toastElement).length === 0)) {
            $toastElement[options.hideMethod]({
                duration: options.hideDuration,
                easing: options.hideEasing,
                complete: function () { removeToast($toastElement); }
            });
            return true;
        }
        return false;
    }

    function createContainer(options) {
        $container = $('<div/>')
            .attr('id', options.containerId)
            .addClass(options.positionClass);

        $container.appendTo($(options.target));
        return $container;
    }

    function getDefaults() {
        return {
            tapToDismiss: true,
            toastClass: 'toast',
            containerId: 'toast-container',
            debug: false,

            showMethod: 'fadeIn', //fadeIn, slideDown, and show are built into jQuery
            showDuration: 300,
            showEasing: 'swing', //swing and linear are built into jQuery
            onShown: undefined,
            hideMethod: 'fadeOut',
            hideDuration: 1000,
            hideEasing: 'swing',
            onHidden: undefined,
            closeMethod: false,
            closeDuration: false,
            closeEasing: false,
            closeOnHover: true,

            extendedTimeOut: 1000,
            iconClasses: {
                error: 'toast-error',
                info: 'toast-info',
                success: 'toast-success',
                warning: 'toast-warning'
            },
            iconClass: 'toast-info',
            positionClass: 'toast-top-right',
            timeOut: 5000, // Set timeOut and extendedTimeOut to 0 to make it sticky
            titleClass: 'toast-title',
            messageClass: 'toast-message',
            escapeHtml: false,
            target: 'body',
            closeHtml: '<button type="button">&times;</button>',
            closeClass: 'toast-close-button',
            newestOnTop: true,
            preventDuplicates: false,
            progressBar: false,
            progressClass: 'toast-progress',
            rtl: false
        };
    }

    function publish(args) {
        if (!listener) { return; }
        listener(args);
    }

    function notify(map) {
        var options = getOptions();
        var iconClass = map.iconClass || options.iconClass;

        if (typeof (map.optionsOverride) !== 'undefined') {
            options = langx.extend(options, map.optionsOverride);
            iconClass = map.optionsOverride.iconClass || iconClass;
        }

        if (shouldExit(options, map)) { return; }

        toastId++;

        $container = getContainer(options, true);

        var intervalId = null;
        var $toastElement = $('<div/>');
        var $titleElement = $('<div/>');
        var $messageElement = $('<div/>');
        var $progressElement = $('<div/>');
        var $closeElement = $(options.closeHtml);
        var progressBar = {
            intervalId: null,
            hideEta: null,
            maxHideTime: null
        };
        var response = {
            toastId: toastId,
            state: 'visible',
            startTime: new Date(),
            options: options,
            map: map
        };

        personalizeToast();

        displayToast();

        handleEvents();

        publish(response);

        if (options.debug && console) {
            console.log(response);
        }

        return $toastElement;

        function escapeHtml(source) {
            if (source == null) {
                source = '';
            }

            return source
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        function personalizeToast() {
            setIcon();
            setTitle();
            setMessage();
            setCloseButton();
            setProgressBar();
            setRTL();
            setSequence();
            setAria();
        }

        function setAria() {
            var ariaValue = '';
            switch (map.iconClass) {
                case 'toast-success':
                case 'toast-info':
                    ariaValue =  'polite';
                    break;
                default:
                    ariaValue = 'assertive';
            }
            $toastElement.attr('aria-live', ariaValue);
        }

        function handleEvents() {
            if (options.closeOnHover) {
                $toastElement.hover(stickAround, delayedHideToast);
            }

            if (!options.onclick && options.tapToDismiss) {
                $toastElement.click(hideToast);
            }

            if (options.closeButton && $closeElement) {
                $closeElement.click(function (event) {
                    if (event.stopPropagation) {
                        event.stopPropagation();
                    } else if (event.cancelBubble !== undefined && event.cancelBubble !== true) {
                        event.cancelBubble = true;
                    }

                    if (options.onCloseClick) {
                        options.onCloseClick(event);
                    }

                    hideToast(true);
                });
            }

            if (options.onclick) {
                $toastElement.click(function (event) {
                    options.onclick(event);
                    hideToast();
                });
            }
        }

        function displayToast() {
            $toastElement.hide();

            $toastElement[options.showMethod](
                {duration: options.showDuration, easing: options.showEasing, complete: options.onShown}
            );

            if (options.timeOut > 0) {
                intervalId = setTimeout(hideToast, options.timeOut);
                progressBar.maxHideTime = parseFloat(options.timeOut);
                progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                if (options.progressBar) {
                    progressBar.intervalId = setInterval(updateProgress, 10);
                }
            }
        }

        function setIcon() {
            if (map.iconClass) {
                $toastElement.addClass(options.toastClass).addClass(iconClass);
            }
        }

        function setSequence() {
            if (options.newestOnTop) {
                $container.prepend($toastElement);
            } else {
                $container.append($toastElement);
            }
        }

        function setTitle() {
            if (map.title) {
                var suffix = map.title;
                if (options.escapeHtml) {
                    suffix = escapeHtml(map.title);
                }
                $titleElement.append(suffix).addClass(options.titleClass);
                $toastElement.append($titleElement);
            }
        }

        function setMessage() {
            if (map.message) {
                var suffix = map.message;
                if (options.escapeHtml) {
                    suffix = escapeHtml(map.message);
                }
                $messageElement.append(suffix).addClass(options.messageClass);
                $toastElement.append($messageElement);
            }
        }

        function setCloseButton() {
            if (options.closeButton) {
                $closeElement.addClass(options.closeClass).attr('role', 'button');
                $toastElement.prepend($closeElement);
            }
        }

        function setProgressBar() {
            if (options.progressBar) {
                $progressElement.addClass(options.progressClass);
                $toastElement.prepend($progressElement);
            }
        }

        function setRTL() {
            if (options.rtl) {
                $toastElement.addClass('rtl');
            }
        }

        function shouldExit(options, map) {
            if (options.preventDuplicates) {
                if (map.message === previousToast) {
                    return true;
                } else {
                    previousToast = map.message;
                }
            }
            return false;
        }

        function hideToast(override) {
            var method = override && options.closeMethod !== false ? options.closeMethod : options.hideMethod;
            var duration = override && options.closeDuration !== false ?
                options.closeDuration : options.hideDuration;
            var easing = override && options.closeEasing !== false ? options.closeEasing : options.hideEasing;
            if ($(':focus', $toastElement).length && !override) {
                return;
            }
            clearTimeout(progressBar.intervalId);
            return $toastElement[method]({
                duration: duration,
                easing: easing,
                complete: function () {
                    removeToast($toastElement);
                    clearTimeout(intervalId);
                    if (options.onHidden && response.state !== 'hidden') {
                        options.onHidden();
                    }
                    response.state = 'hidden';
                    response.endTime = new Date();
                    publish(response);
                }
            });
        }

        function delayedHideToast() {
            if (options.timeOut > 0 || options.extendedTimeOut > 0) {
                intervalId = setTimeout(hideToast, options.extendedTimeOut);
                progressBar.maxHideTime = parseFloat(options.extendedTimeOut);
                progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
            }
        }

        function stickAround() {
            clearTimeout(intervalId);
            progressBar.hideEta = 0;
            $toastElement.stop(true, true)[options.showMethod](
                {duration: options.showDuration, easing: options.showEasing}
            );
        }

        function updateProgress() {
            var percentage = ((progressBar.hideEta - (new Date().getTime())) / progressBar.maxHideTime) * 100;
            $progressElement.width(percentage + '%');
        }
    }

    function getOptions() {
        return langx.extend({}, getDefaults(), toastr.options);
    }

    function removeToast($toastElement) {
        if (!$container) { $container = getContainer(); }
        if ($toastElement.is(':visible')) {
            return;
        }
        $toastElement.remove();
        $toastElement = null;
        if ($container.children().length === 0) {
            $container.remove();
            previousToast = undefined;
        }
    }

    return langx.attach(skylark,"itg.toastr",toastr);
});
define('skylark-toastr/main',[
	"./toastr"
],function(toastr){
	return toastr;
});
define('skylark-toastr', ['skylark-toastr/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-toastr.js.map
