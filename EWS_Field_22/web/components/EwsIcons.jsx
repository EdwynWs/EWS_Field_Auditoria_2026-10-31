import React from 'react';

const paths = {
  arrow: <><path d="M4 12h16M13 5l7 7-7 7"/></>,
  arrowUp: <><path d="M7 17 17 7M8 7h9v9"/></>,
  arrowDown: <><path d="M12 4v16m-7-7 7 7 7-7"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  checkCircle: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  arrowRight: <path d="m9 18 6-6-6-6"/>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close: <path d="M5 5 19 19M19 5 5 19"/>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  mapPin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  clipboard: <><rect x="5" y="5" width="14" height="17" rx="2"/><path d="M9 5V3h6v2M9 11h6M9 15h6"/></>,
  camera: <><path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="3"/></>,
  chart: <><path d="M4 20V4M4 20h16M8 16v-5M13 16V7M18 16V4"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
  file: <><path d="M6 2h8l5 5v15H6z"/><path d="M14 2v6h5M9 13h7M9 17h7"/></>,
  smartphone: <><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></>,
  settings: <><path d="M4 7h16M7 4v6M4 17h16m13-3v6M4 12h16"/></>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-12h-7z"/>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 9a7 7 0 0 1 12-2l2 5M4 12l2 5a7 7 0 0 0 12-2"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M14 7h2M9 11h2M14 11h2M9 15h2M14 15h2M10 21v-3h4v3"/></>,
  wrench: <><path d="M21 6a7 7 0 0 1-9 8L5 21l-3-3 7-7a7 7 0 0 1 8-9l-4 4 4 4z"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  chevron: <path d="m6 9 6 6 6-6"/>,
  alert: <><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3h.01"/></>,
  spinner: <><path d="M12 3a9 9 0 1 1-9 9"/></>,
};
export default function Icon({name, size=22, strokeWidth=1.8, className='', ...props}) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>{paths[name] || paths.bolt}</svg>;
}
