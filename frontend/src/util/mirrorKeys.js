export default function mirrorKeys(obj) {
  const mirrored = {};
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      mirrored[prop] = prop;
    }
  }
  return mirrored;
}
