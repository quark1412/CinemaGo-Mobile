import { cinemaService } from "@/services/cinema";
import { movieService } from "@/services/movie";
import { showTimeService } from "@/services/showtime";
import { useEffect, useState } from "react";

import type { Cinema } from "@/types/cinema";
import type { Movie as ApiMovie } from "@/types/movie";
import type { Showtime } from "@/types/showtime";

export type MovieWithLabels = ApiMovie & {
  labels: {
    name: string;
    showtimes: Showtime[];
  }[];
};

export function useCinemaShowtimes(cinemaId?: string) {
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [movies, setMovies] = useState<MovieWithLabels[]>([]);
  const [loadingCinema, setLoadingCinema] = useState(false);
  const [loadingMovies, setLoadingMovies] = useState(false);

  useEffect(() => {
    if (!cinemaId) return;

    let cancelled = false;

    const fetchCinema = async () => {
      try {
        setLoadingCinema(true);

        const c: Cinema = await cinemaService.getCinemaById(cinemaId);
        if (!cancelled) setCinema(c);
      } catch (err) {
        console.error("Lỗi getCinemaById:", err);
      } finally {
        if (!cancelled) setLoadingCinema(false);
      }
    };

    fetchCinema();

    return () => {
      cancelled = true;
    };
  }, [cinemaId]);

  useEffect(() => {
    if (!cinemaId) return;

    let cancelled = false;

    const fetchShowtimesAndMovies = async () => {
      try {
        setLoadingMovies(true);

        const allShowtimes: Showtime[] = [];
        let page = 1;
        const limit = 20;
        let hasNextPage = true;

        const nowIso = new Date().toISOString();
        console.log(nowIso);

        while (hasNextPage && !cancelled) {
          const res = await showTimeService.getShowTimes({
            page,
            limit,
            cinemaId,
            startTime: nowIso,
          });

          const data: Showtime[] = res.data ?? [];
          const pagination = res.pagination;

          allShowtimes.push(...data);

          if (!pagination || !pagination.hasNextPage) {
            hasNextPage = false;
          } else {
            page = (pagination.currentPage ?? page) + 1;
          }
        }

        if (cancelled) return;

        const now = new Date();
        const futureShowtimes = allShowtimes.filter((st) => {
          const iso = st.startTime as string | undefined;
          if (!iso) return false;
          const d = new Date(iso);
          if (isNaN(d.getTime())) return false;
          return d.getTime() >= now.getTime();
        });

        if (futureShowtimes.length === 0) {
          setMovies([]);
          return;
        }

        const movieIdSet = new Set(
          futureShowtimes
            .map((st: Showtime) => st.movieId)
            .filter((id: string | undefined) => !!id)
        );
        const movieIds = Array.from(movieIdSet) as string[];

        if (movieIds.length === 0) {
          setMovies([]);
          return;
        }

        const moviePromises = movieIds.map(async (movieId) => {
          try {
            const movie: ApiMovie = await movieService.getMovieById(movieId);

            const myShowtimes = allShowtimes.filter(
              (st: Showtime) => st.movieId === movieId
            );
            if (myShowtimes.length === 0) return null;

            // group theo format
            const labelMap = new Map<string, Showtime[]>();

            myShowtimes.forEach((st) => {
              const formatName = st.format ?? "Suất chiếu";
              const list = labelMap.get(formatName) ?? [];
              list.push(st);
              labelMap.set(formatName, list);
            });

            const labels: MovieWithLabels["labels"] = Array.from(
              labelMap.entries()
            ).map(([name, showtimes]) => ({ name, showtimes }));

            const movieWithShowtimes: MovieWithLabels = {
              ...movie,
              labels,
            };

            return movieWithShowtimes;
          } catch (err) {
            console.error("Lỗi getMovieById:", err);
            return null;
          }
        });

        const moviesWithShowtimes = (await Promise.all(
          moviePromises
        )) as (MovieWithLabels | null)[];

        const finalMovies = moviesWithShowtimes.filter(
          (m): m is MovieWithLabels =>
            !!m &&
            (m.labels ?? []).some((g) => g.showtimes && g.showtimes.length > 0)
        );

        if (!cancelled) setMovies(finalMovies);
      } catch (err) {
        console.error("Lỗi fetch showtimes + movies:", err);
        if (!cancelled) setMovies([]);
      } finally {
        if (!cancelled) setLoadingMovies(false);
      }
    };

    fetchShowtimesAndMovies();

    return () => {
      cancelled = true;
    };
  }, [cinemaId]);

  return {
    cinema,
    movies,
    loadingCinema,
    loadingMovies,
  };
}
