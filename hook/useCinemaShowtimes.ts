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
        console.log("Lỗi getCinemaById:", err);
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

        const now = new Date();
        const nowIso = now.toISOString();

        console.log("Time sent to API (UTC):", nowIso);

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

        const nowTimestamp = now.getTime();

        const futureShowtimes = allShowtimes.filter((st) => {
          if (!st.startTime) return false;

          const showDate = new Date(st.startTime);

          if (isNaN(showDate.getTime())) return false;

          return showDate.getTime() >= nowTimestamp;
        });

        futureShowtimes.sort((a, b) => {
          return (
            new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
          );
        });

        if (futureShowtimes.length === 0) {
          setMovies([]);
          return;
        }

        const movieIdSet = new Set(
          futureShowtimes
            .map((st) => st.movieId)
            .filter((id): id is string => !!id)
        );
        const movieIds = Array.from(movieIdSet);

        const moviePromises = movieIds.map(async (movieId) => {
          try {
            const movie: ApiMovie = await movieService.getMovieById(movieId);

            const myShowtimes = futureShowtimes.filter(
              (st) => st.movieId === movieId
            );

            if (myShowtimes.length === 0) return null;

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

            return { ...movie, labels };
          } catch (err) {
            console.log(`Lỗi getMovieById (${movieId}):`, err);
            return null;
          }
        });

        const moviesWithShowtimes = (await Promise.all(moviePromises)).filter(
          (m): m is MovieWithLabels => !!m
        );

        if (!cancelled) setMovies(moviesWithShowtimes);
      } catch (err) {
        console.log("Lỗi fetch showtimes + movies:", err);
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

  return { cinema, movies, loadingCinema, loadingMovies };
}
