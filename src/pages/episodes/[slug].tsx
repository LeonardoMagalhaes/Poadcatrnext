import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Image from 'next/image';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';

import { api } from '../../services/api';
import { convertDurationTimeString } from '../../utils/convertDurationToTimeString';

import styles from './episode.module.scss';
import { usePlayer } from '../../contexts/PlayerContexts';
import React from 'react';

type Episode = {
  id: string;
  title: string;
  thumbnail: string;
  members: string;
  publishedAt: string;
  duration: number;
  durationAsString: string;
  url: string;
  description: string;
};

type EpisodeProps = {
  episode: Episode;
};

export default function Episode({ episode }: EpisodeProps) {
  const { play } = usePlayer();

  return (
    <div className={styles.episode}>      
      <Head>
        <title>{episode.title} | Podcastr</title>
      </Head>
      
      <div className={styles.thumbnailContainer}>
        <Link href="/">
          <button type="button">
            <img src="/arrow-left.svg" alt="Voltar"/>
          </button>
        </Link>
        <Image 
          width={700}
          height={160}
          src={episode.thumbnail}
          objectFit="cover"
        />
        <button type="button" onClick={() => play(episode)}>
          <img src="/play.svg" alt="Tocar episódio"/>
        </button>
      </div>

      <header>
        <h1>{episode.title}</h1>
        <span>{episode.members}</span>
        <span>{episode.publishedAt}</span>
        <span>{episode.durationAsString}</span>
      </header>

      <div
        className={styles.description}
        dangerouslySetInnerHTML={{ __html: episode.description}}
      />
    </div>
  )
}

// Toda rota dinamica (que tenha o colchete [slug] no caso) precisa deste metodo. 
export const getStaticPaths: GetStaticPaths = async () => {
  const { data } = await api.get('episodes', {
    params: {
      _limit: 2,
      _sort: 'published_at',
      _order: 'desc'
    }
  });  

  const paths = data.map(episode => {
    return {
      params: {
        slug: episode.id
      }
    }
  });

  return {
    // path: quais paginas estaticas eu quero gerar no momento da build
    paths,
    // se o fallback for falso, quando acessar alguma pagina estatica que nao estiver no path, ele retorna 404. Com o blocking ele renderiza a pagina na hora.
    fallback: 'blocking' // Recomendade deixar blocking
    // Com o fallback true, quando acessado alguma pagina que nao é estática, ele gera uma página estática no lado do cliente.
  }
}

// A geracao estatica so funciona quando builda o projeto, ou seja, como se estivesse em producao. yarn dev nao funciona.
export const getStaticProps: GetStaticProps = async (ctx) => {
  const { slug } = ctx.params;

  const { data } = await api.get(`/episodes/${slug}`);

  const episode = {
    id: data.id,
    title: data.title,
    thumbnail: data.thumbnail,
    members: data.members,
    publishedAt: format(parseISO(data.published_at), 'd MMM yy', { locale: ptBR }),
    duration: Number(data.file.duration),
    durationAsString: convertDurationTimeString(Number(data.file.duration)),
    description: data.description,
    url: data.file.url
  }

  return {
    props: {
      episode,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  }
}