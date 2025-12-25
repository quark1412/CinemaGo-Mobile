import { router } from "expo-router";

export const isYoutubeUrl = (url: string) => {
  const lower = url.toLowerCase();
  return lower.includes("youtube.com") || lower.includes("youtu.be");
};

export const getYoutubeId = (url: string) => {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/embed/")[1];
      }

      const v = u.searchParams.get("v");
      if (v) return v;
    }

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "");
    }
  } catch (e) {
    console.log("parse youtube url error", e);
  }
  return null;
};

export const buildOptimizedTrailerUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return null;

  const match = rawUrl.match(
    /(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.*)/
  );
  if (!match) return rawUrl;

  const base = match[1];
  const rest = match[2];

  const transformations = "c_limit,w_480,f_auto,q_auto:eco,so_0,d_30";

  return `${base}${transformations}/${rest}`;
};

export const handleMovieTrailerPress = (
  movie: { title?: string | null; trailerUrl?: string | null },
  onCloudinaryTrailer?: (optimizedUrl: string) => void
) => {
  if (!movie.trailerUrl) return;

  const url = movie.trailerUrl.trim();

  if (isYoutubeUrl(url)) {
    const youtubeId = getYoutubeId(url);
    if (!youtubeId) return;

    router.push({
      pathname: "/showtimes/trailer",
      params: {
        youtubeId,
        title: movie.title ?? "",
      },
    });
    return;
  }

  if (!onCloudinaryTrailer) return;

  const optimized = buildOptimizedTrailerUrl(url);
  if (!optimized) return;

  onCloudinaryTrailer(optimized);
};
