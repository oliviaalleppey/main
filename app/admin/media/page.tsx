import { getHeroMedia } from './actions';
import MediaUploadForm from './MediaUploadForm';
import { Film, Image as ImageIcon } from 'lucide-react';

export const metadata = {
    title: 'Media Hub | Admin',
};

export default async function MediaPage() {
    const media = await getHeroMedia();

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-[#1C1C1C] flex items-center gap-3">
                    <Film className="w-8 h-8 text-amber-500" /> Media Hub
                </h1>
                <p className="text-sm text-gray-500 mt-2">Manage the homepage hero video and imagery.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8">
                {/* Current Media Preview */}
                <div className="flex-1">
                    <h2 className="text-lg font-medium text-[#1C1C1C] mb-4">Current Home Page Hero</h2>
                    <div className="rounded-xl overflow-hidden bg-gray-100 aspect-video relative flex items-center justify-center border border-gray-200 shadow-inner">
                        {media ? (
                            media.type === 'video' ? (
                                <video src={media.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                            ) : (
                                <img src={media.url} alt="Hero Media" className="w-full h-full object-cover" />
                            )
                        ) : (
                            <div className="text-center text-gray-400">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">No media uploaded yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Form */}
                <div className="flex-1">
                    <h2 className="text-lg font-medium text-[#1C1C1C] mb-4">Upload New Media</h2>
                    <MediaUploadForm />
                </div>
            </div>
        </div>
    );
}
