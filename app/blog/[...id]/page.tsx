import { PostTopicBadge } from '@/components/post-topic-badge'
import YoutubeVideoPlayer from '@/components/video-player'
import { db } from '@/lib/db'
import { parseEditorJson } from '@/utils/parseEditorJson'
import { Post } from '@prisma/client'
import { Metadata, ResolvingMetadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

interface Element {
  type: string
  text: string
}

interface PostPageProps {
  params: {
    id: string[]
  }
}

interface Params {
  id?: string[]
}

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const id = params.id[0]

  const post = await db.post.findUnique({
    where: {
      id: id,
    },
  })

  if (!post || post === undefined) {
    return {
      title: 'RHCraft',
      openGraph: {
        images: [''],
      },
    }
  }

  return {
    title: post.title && post.title !== undefined ? post.title : '',
    openGraph: {
      images: [
        post.imageURL && post.imageURL !== undefined ? post.imageURL : '',
      ],
    },
    keywords: ['Minecraft', 'RHCraft', 'Blog', 'Post', 'RealmInHeart'],
  }
}

async function getAuthorInfo(authorID: string | null) {
  if (authorID) {
    const author = db.user.findUnique({
      where: { id: authorID },
      select: {
        name: true,
        image: true,
      },
    })

    if (!author) {
      null
    }

    return author
  }
}

async function getPostFromParams(params: Params): Promise<{
  post: Post
  author: { name: string | null; image: string | null }
} | null> {
  const id = params?.id?.join('/')

  const fetchedPost = await db.post.findUnique({
    where: {
      id: id,
    },
  })

  if (!fetchedPost || fetchedPost.published === false) {
    return null
  }

  const author = await getAuthorInfo(fetchedPost.authorId)

  if (!author) {
    return null
  }

  return { post: fetchedPost, author }
}
export const revalidate = 600
export const dynamic = 'force-dynamic'

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostFromParams(params)

  if (!post) {
    notFound()
  }

  if (!post.post) {
    return null
  }

  const content =
    post.post.content &&
    ((await parseEditorJson(post.post.content)) as Element[])

  return (
    <div className=" mt-4 w-full flex flex-col items-start justify-start gap-4 mb-12">
      <div className=" w-full flex flex-col items-start justify-start gap-4">
        <div className="flex items-center justify-center gap-2">
          {post.author?.image && (
            <div className="w-8 h-8">
              <Image
                className=" rounded-full w-full h-full z-20"
                src={post.author?.image}
                alt="Author picture"
                width={30}
                height={30}
                priority
              />
            </div>
          )}
          <div className="flex flex-col items-start justify-start gap-1">
            <p className="font-sans text-base font-semibold text-orange-200 leading-4">
              {post.author?.name}
            </p>
            <p className="font-sans text-neutral-400 leading-3">
              {`${post.post.createdAt.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}`}
            </p>
          </div>
        </div>
        {post.post.topic && <PostTopicBadge topic={post.post.topic} />}
        <h1 className="font-inter font-medium tracking-wide text-2xl leading-7">
          {post.post.title}
        </h1>
        <div className="w-full max-w-[50rem] font-roboto flex flex-col justify-start items-start gap-2">
          {content &&
            content.map(
              (
                element: { type: string; text: string; id?: string },
                index: number,
              ) => {
                if (element.type === 'header') {
                  return (
                    <h3
                      key={index}
                      className="text-[#d9d9d9] text-2xl font-medium"
                    >
                      {element.text}
                    </h3>
                  )
                } else if (element.type === 'paragraph') {
                  return (
                    <p
                      key={index}
                      className="text-[#c1c1c1] tracking-wide prose-a:text-[#a1e780] hover:prose-a:text-[#bbf0a2]"
                      dangerouslySetInnerHTML={{ __html: element.text }}
                    />
                  )
                } else if (element.type === 'youtubeEmbed') {
                  return (
                    <div
                      key={index}
                      className="youtube-embed w-full h-full mt-4"
                    >
                      <YoutubeVideoPlayer id={element.id ? element.id : ''} />
                    </div>
                  )
                }
                return null
              },
            )}
        </div>
        <p className="font-sans text-neutral-400 leading-3 mt-8 whitespace-nowrap">
          Last updated:
          {` ${post.post.updatedAt.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })}`}
        </p>
      </div>
    </div>
  )
}
