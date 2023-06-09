import { PostTopicBadge } from '@/components/post-topic-badge'
import YoutubeVideoPlayer from '@/components/video-player'
import ViewCounter from '@/components/view-counter'
import { db } from '@/lib/db'
import { parseEditorJson } from '@/lib/parseEditorJson'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
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

  const createdAtDate = post.createdAt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return {
    title: post.title && post.title !== undefined ? post.title : '',
    description: `${createdAtDate}`,
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

  const post = await db.post.findUnique({
    where: {
      id: id,
    },
  })

  if (!post || post.published === false) {
    return null
  }

  const author = await getAuthorInfo(post.authorId)

  if (!author) {
    return null
  }

  return { post, author }
}
export const revalidate = 600
export const dynamic = 'force-dynamic'

export default async function PostPage({ params }: PostPageProps) {
  const data = await getPostFromParams(params)

  if (!data) {
    notFound()
  }

  const { author, post } = data

  const content =
    post.content && ((await parseEditorJson(post.content)) as Element[])

  return (
    <div className=" mt-4 w-full flex flex-col items-start justify-start gap-4 mb-12 p-4 py-12 max-w-[80rem] mx-auto my-0">
      {post.imageURL && (
        <div className="w-full max-w-[50rem] max-sm:h-60 h-96 rounded flex items-start justify-start ml-0 relative">
          <Image
            priority
            src={post.imageURL}
            alt="Picture of post preview"
            fill
            className="rounded object-cover "
          />
        </div>
      )}
      <div className=" w-full flex flex-col items-start justify-start gap-4">
        <div className="flex items-center justify-center gap-2">
          {author?.image && (
            <div className="w-8 h-8">
              <Image
                className=" rounded-full w-full h-full z-20 bg-neutral-700"
                src={author?.image}
                alt="Author picture"
                width={30}
                height={30}
                priority
              />
            </div>
          )}
          <div className="flex flex-col items-start justify-start gap-1">
            <p className="font-sans text-base font-semibold text-orange-200 leading-4">
              {author?.name}
            </p>
            <p className="font-sans text-neutral-400 leading-3">
              {`${post.createdAt.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}`}
            </p>
          </div>
        </div>
        {post.topic && <PostTopicBadge topic={post.topic} />}
        <ViewCounter postId={post.id} views={post.views} />
        <h1 className="font-inter font-medium tracking-wide text-2xl leading-7 mt-2 mb-2">
          {post.title}
        </h1>
        <div className="w-full max-w-[50rem] font-roboto flex flex-col justify-start items-start gap-2">
          {content &&
            content.map(
              (
                element: {
                  type: string
                  text: string
                  id?: string
                  style?: string
                  items?: string[]
                },
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
                      className="text-[#c1c1c1] text-lg max-sm:text-base tracking-wide prose-a:text-[#a1e780] hover:prose-a:text-[#bbf0a2] hover:prose-a:underline"
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
                } else if (element.type === 'list') {
                  if (element.style === 'ordered') {
                    return (
                      <ol
                        key={index}
                        className="list-decimal pl-8 text-[#c1c1c1] text-lg max-sm:text-base marker:text-[#d9d9d9]"
                      >
                        {element.items &&
                          element.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="mb-2">
                              {item}
                            </li>
                          ))}
                      </ol>
                    )
                  } else if (element.style === 'unordered') {
                    return (
                      <ul
                        key={index}
                        className="list-disc pl-8 text-[#c1c1c1] text-lg max-sm:text-base marker:text-[#d9d9d9]"
                      >
                        {element.items &&
                          element.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="mb-2">
                              {item}
                            </li>
                          ))}
                      </ul>
                    )
                  }
                } else if (element.type === 'delimiter') {
                  return (
                    <p
                      key={index}
                      className="text-neutral-500 tracking-widest text-3xl font-medium w-full text-center my-6"
                    >
                      {element.text}
                    </p>
                  )
                }
                return null
              },
            )}
        </div>
      </div>
    </div>
  )
}
