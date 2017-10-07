function mirrorKeys(obj) {
  const mirrored = {};
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      mirrored[prop] = prop;
    }
  }
  return mirrored;
}

function pascalCaseify(s) {
  const words = s.trim().split(/\s+/);
  const toJoin = words.map((word) => {
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
  return toJoin.join('');
}

function shallowCloneOmitting(originalObj, propName) {
  const {[propName]: omitted, ...result} = originalObj;
  return result;
}

function shallowCloneReplacing(originalObj, propName, propValue) {
  return {...originalObj, [propName]: propValue};
}

function getComponentDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export {
  mirrorKeys,
  pascalCaseify,
  shallowCloneOmitting,
  shallowCloneReplacing,
  getComponentDisplayName,
};
