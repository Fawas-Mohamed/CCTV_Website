export const products = [
  { id: 'bullet', name: 'Outdoor Bullet Camera', specs: ['Weatherproof', '4K', 'Night Vision'], icon: 'sun', color: '#101722', price: 129, categories: ['Business', 'Outdoor'], description: 'Rugged, weather-ready coverage with sharp 4K detail after dark.' },
  { id: 'dome', name: 'Dome Camera', specs: ['Discreet', '4K', 'Wide Angle'], icon: 'eye', color: '#111722', price: 109, categories: ['Home', 'Business'], description: 'A discreet wide-angle view for entrances, halls, and shared spaces.' },
  { id: 'ptz', name: 'PTZ Camera', specs: ['Pan', 'Tilt', 'Zoom', '4K'], icon: 'target', color: '#eef2f6', price: 249, categories: ['Business', 'Outdoor'], description: 'Move the view where you need it with pan, tilt, and optical zoom.' },
  { id: 'ip', name: 'IP Camera', specs: ['High Resolution', 'PoE', 'Smart AI'], icon: 'camera', color: '#f1f4f7', price: 149, categories: ['Home', 'Business'], description: 'Flexible network video with clear detail and smart event detection.' },
  { id: 'indoor', name: 'Indoor Camera', specs: ['Compact', '1080p', 'Two-way Audio'], icon: 'home', color: '#f5f6f8', price: 59, categories: ['Home'], description: 'A compact indoor view with two-way audio for everyday check-ins.' },
  { id: 'fisheye', name: 'Fisheye Camera', specs: ['360° Coverage', '5MP', 'Panoramic View'], icon: 'aperture', color: '#121a25', price: 179, categories: ['Home', 'Business'], description: 'A panoramic 360° view that helps reduce blind spots in open rooms.' },
];

export const categories = [
  { id: 'home', name: 'home cameras', title: 'Home cameras', video: '/videos/home.mp4', poster: '/frames/CCTV_frames_30fps/frame_0001.jpg', filter: 'Home' },
  { id: 'business', name: 'business systems', title: 'Business systems', video: '/videos/business.mp4', poster: '/frames/CCTV_frames_30fps/frame_0180.jpg', filter: 'Business' },
  { id: 'outdoor', name: 'night & outdoor', title: 'Night & outdoor', video: '/videos/outdoor.mp4', poster: '/frames/CCTV_frames_30fps/frame_0120.jpg', filter: 'Outdoor' },
];

export const services = [
  { number: '01', category: 'PLAN', name: 'Site Survey & Design', copy: 'A practical plan shaped around your building, entry points, and priorities.', images: ['0001', '0090', '0120'] },
  { number: '02', category: 'INSTALL', name: 'Professional Installation', copy: 'Careful placement, tidy setup, and a clear walkthrough of your system.', images: ['0060', '0100', '0150'] },
  { number: '03', category: 'PROTECT', name: 'Monitoring & Cloud', copy: 'Keep the right footage accessible when you need to review an event.', images: ['0180', '0210', '0240'] },
  { number: '04', category: 'CARE', name: 'Maintenance & Upgrades', copy: 'Keep cameras, connections, and storage working as your needs change.', images: ['0030', '0200', '0240'] },
];

export const reviews = [
  { name: 'James T.', role: 'Homeowner', quote: 'Crystal clear video, even at night. Installation was super easy and the quality is outstanding!', frame: '0001' },
  { name: 'Sarah M.', role: 'Homeowner', quote: 'The dome cameras are sleek and powerful. We feel much safer at home now.', frame: '0090' },
  { name: 'David K.', role: 'Business owner', quote: 'Great coverage around our property. The app is simple and works flawlessly.', frame: '0120' },
  { name: 'Priya S.', role: 'Homeowner', quote: 'The night vision is incredible. I can clearly see everything, even in complete darkness.', frame: '0180' },
  { name: 'Michael R.', role: 'Homeowner', quote: 'Compact, stylish and super reliable. Perfect for indoor monitoring.', frame: '0200' },
  { name: 'Emily L.', role: 'Business owner', quote: 'Best security investment we’ve made. High quality, reliable, and gives us real peace of mind.', frame: '0240' },
  { name: 'Alex P.', role: 'Business owner', quote: 'The site survey helped us cover the entrances we had overlooked.', frame: '0060' },
  { name: 'Nadia W.', role: 'Homeowner', quote: 'The cameras are simple to use and the picture is sharp in every room.', frame: '0100' },
  { name: 'Chris B.', role: 'Property manager', quote: 'A clean installation and a much clearer view of the building after hours.', frame: '0150' },
  { name: 'Maya D.', role: 'Homeowner', quote: 'The system feels thoughtfully set up and easy for the whole family.', frame: '0210' },
];
