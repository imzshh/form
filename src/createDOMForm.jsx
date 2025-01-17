import createBaseForm from './createBaseForm';
import { mixin as formMixin } from './createForm';
import { getParams } from './utils';
import ReactDOM from 'react-dom';
import scrollIntoView from 'dom-scroll-into-view';

function computedStyle(el, prop) {
  const getComputedStyle = window.getComputedStyle;
  const style =
    // If we have getComputedStyle
    getComputedStyle ?
      // Query it
      // TODO: From CSS-Query notes, we might need (node, null) for FF
      getComputedStyle(el) :

      // Otherwise, we are in IE and use currentStyle
      el.currentStyle;
  if (style) {
    return style
      [
      // Switch to camelCase for CSSOM
      // DEV: Grabbed from jQuery
      // https://github.com/jquery/jquery/blob/1.9-stable/src/css.js#L191-L194
      // https://github.com/jquery/jquery/blob/1.9-stable/src/core.js#L593-L597
      prop.replace(/-(\w)/gi, (word, letter) => {
        return letter.toUpperCase();
      })
      ];
  }
  return undefined;
}

function getScrollableContainer(n) {
  let node = n;
  let nodeName;
  /* eslint no-cond-assign:0 */
  while ((nodeName = node.nodeName.toLowerCase()) !== 'body') {
    const overflowY = computedStyle(node, 'overflowY');
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node;
    }
    node = node.parentNode;
  }
  return nodeName === 'body' ? node.ownerDocument : node;
}

const mixin = {
  getForm() {
    return {
      ...formMixin.getForm.call(this),
      validateFieldsAndScroll: this.validateFieldsAndScroll,
    };
  },

  validateFieldsAndScroll(ns, opt, cb) {
    const { names, callback, options } = getParams(ns, opt, cb);

    function newCb(error, values) {
      if (error) {
        let firstNode;
        let firstTop;
        for (const name in error) {
          if (error.hasOwnProperty(name) && error[name].instance) {
            const node = ReactDOM.findDOMNode(error[name].instance);
            const top = node.getBoundingClientRect().top;
            if (firstTop === undefined || firstTop > top) {
              firstTop = top;
              firstNode = node;
            }
          }
        }
        if (firstNode) {
          const c = options.container || getScrollableContainer(firstNode);
          scrollIntoView(firstNode, c, {
            onlyScrollIfNeeded: true,
            ...options.scroll,
          });
        }
      }

      if (typeof callback === 'function') {
        callback(error, values);
      }
    }

    return this.validateFields(names, options, newCb);
  },
};

function createDOMForm(option) {
  return createBaseForm({
    ...option,
  }, [mixin]);
}

export default createDOMForm;
