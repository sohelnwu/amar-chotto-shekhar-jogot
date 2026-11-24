import { Link } from 'react-router-dom';
import { Mascot } from '../components/Mascot';

export function NotFound() {
  return (
    <div className="bg-playful grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <Mascot className="mx-auto size-32" />
        <h1 className="mt-4 text-3xl font-bold">এই পাতাটা খুঁজে পাইনি</h1>
        <Link to="/" className="pressable mt-6 inline-block rounded-full bg-grape px-6 py-3 text-xl font-bold text-white shadow-pop">
          হোমে যাও
        </Link>
      </div>
    </div>
  );
}
