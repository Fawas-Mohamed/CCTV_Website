export const products = [
  { id: 'bullet', name: 'Outdoor Bullet Camera', specs: ['Weatherproof', '4K', 'Night Vision'], icon: 'sun', color: '#101722', price: 129, categories: ['Business', 'Outdoor'], description: 'Weatherproof 4K housing with night vision. Built for doors, driveways and every outdoor edge.' },
  { id: 'dome', name: 'Dome Camera', specs: ['Discreet', '4K', 'Wide Angle'], icon: 'eye', color: '#111722', price: 109, categories: ['Home', 'Business'], description: 'Discreet 4K dome with a wide-angle lens. Sees the whole room without drawing the eye.' },
  { id: 'ptz', name: 'PTZ Camera', specs: ['Pan', 'Tilt', 'Zoom', '4K'], icon: 'target', color: '#eef2f6', price: 249, categories: ['Business', 'Outdoor'], description: 'Pan, tilt and zoom in 4K. One camera follows the action across the whole yard.' },
  { id: 'ip', name: 'IP Camera', specs: ['High Resolution', 'PoE', 'Smart AI'], icon: 'camera', color: '#f1f4f7', price: 149, categories: ['Home', 'Business'], description: 'High-resolution PoE camera with smart AI alerts. Cleaner cabling, sharper detail.' },
  { id: 'indoor', name: 'Indoor Camera', specs: ['Compact', '1080p', 'Two-way Audio'], icon: 'home', color: '#f5f6f8', price: 59, categories: ['Home'], description: 'Compact 1080p with two-way audio. Talk to the door or the nursery from your phone.' },
  { id: 'fisheye', name: 'Fisheye Camera', specs: ['360° Coverage', '5MP', 'Panoramic View'], icon: 'aperture', color: '#121a25', price: 179, categories: ['Home', 'Business'], description: '360° coverage in 5MP. A panoramic view that leaves no blind corner.' },
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
