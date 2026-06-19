type TippyInstance = {
  destroy: () => void;
  hide: () => void;
  show: () => void;
  setProps: () => void;
  enable: () => void;
  disable: () => void;
  popper: { firstChild: null };
  state: { isVisible: boolean };
};

const tippy = Object.assign(
  ((_target: Element, _options?: unknown): TippyInstance => ({
    destroy: () => {},
    hide: () => {},
    show: () => {},
    setProps: () => {},
    enable: () => {},
    disable: () => {},
    popper: { firstChild: null },
    state: { isVisible: false },
  })),
  { setDefaultProps: () => {} },
);

export default tippy;
