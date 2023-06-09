'use client'

import '../../styles/editor.css'
import EditorJS from '@editorjs/editorjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../button'
import { useRouter } from 'next/navigation'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { postPatchSchema } from '@/lib/validations/post'
import { Post } from '@prisma/client'
import { TopicSelection } from './topic-selection'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ImageUploader } from './image-uploader'
import { toast } from 'react-hot-toast'

const PostEditing = ({ post }: { post: Post }) => {
  const editorRef = useRef<EditorJS>()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isPublishing, setIsPublishing] = useState<boolean>(false)
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [title, setTitle] = useState(post.title)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(post.topic)
  const [uploadedImage, setUploadedImage] = useState<any | null>(null)

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(
    post.imageURL,
  )

  const initializeEditor = useCallback(async () => {
    const EditorJS = (await import('@editorjs/editorjs')).default
    const Header = (await import('@editorjs/header')).default
    // @ts-ignore
    const LinkAutocomplete = (await import('@editorjs/link-autocomplete'))
      .default
    // @ts-ignore
    const YoutubeEmbed = (await import('editorjs-youtube-embed')).default
    // @ts-ignore
    const List = (await import('@editorjs/list')).default
    // @ts-ignore
    const Delimiter = (await import('@editorjs/delimiter')).default

    const body = postPatchSchema.parse(post)

    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: 'editor',
        onReady() {
          editorRef.current = editor
        },
        placeholder: 'Type here to write your post...',
        inlineToolbar: true,
        data: body.content,
        tools: {
          header: Header,
          link: {
            class: LinkAutocomplete,
            config: {
              endpoint: 'https://rhcraft.vercel.app/',
              queryParam: 'search',
            },
          },
          youtubeEmbed: YoutubeEmbed,
          list: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered',
            },
          },
          delimiter: Delimiter,
        },
      })
    }
  }, [post])

  const handlePostEditing = async (e: React.FormEvent) => {
    e.preventDefault()

    const blocks = await editorRef.current?.save()

    setIsSaving(true)

    try {
      const imageURL = await getImageURL()

      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          content: blocks,
          topic: selectedTopic,
          imageURL: imageURL,
        }),
      })

      if (!response?.ok) {
        toast.error('An error ocurred while saving post.')
        setIsSaving(false)
      }

      setIsSaving(false)

      toast.success('Post successfully saved.')

      router.refresh()
    } catch (err) {
      setIsSaving(false)
      toast.error('Something happen while saving post.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handlePostPublishing = async () => {
    setIsPublishing(true)

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: !post.published,
        }),
      })

      if (!response.ok) {
        setIsPublishing(false)
        toast.error('An error ocurred while publishing post.')
      } else {
        setIsPublishing(false)

        toast.success(
          `Post successfully ${post.published ? 'unpublished' : 'published'}`,
        )

        router.refresh()
      }
    } catch (err) {
      setIsPublishing(false)
      toast.error('Something happen while publishing post.')
    }
  }

  const handleImageChange = (image: File | null) => {
    setUploadedImage(image)
    setPreviewImageUrl(image ? URL.createObjectURL(image) : '')
  }

  const getImageURL = async () => {
    if (uploadedImage) {
      if (!post.imageURL && post.authorId) {
        try {
          const formData = new FormData()
          formData.append('file', uploadedImage)
          formData.append('authorId', post.authorId)
          const res = await fetch('/api/posts/media/upload', {
            method: 'POST',
            body: formData,
          })
          if (!res.ok) {
            toast.error('An error occurred while uploading the image.')
            return
          }
          const data = await res.json()
          return data.imageURL
        } catch (err) {
          toast.error('Something happened while uploading the image.')
        }
      } else if (post.imageURL && post.authorId) {
        try {
          const deleted = await deleteImage(post.imageURL)
          if (deleted) {
            const formData = new FormData()
            formData.append('file', uploadedImage)
            formData.append('authorId', post.authorId)
            const res = await fetch('/api/posts/media/upload', {
              method: 'POST',
              body: formData,
            })
            if (!res.ok) {
              toast.error('An error occurred while uploading the image.')
              return
            }
            const data = await res.json()
            return data.imageURL
          } else {
            return post.imageURL
          }
        } catch (err) {
          toast.error('Something happened while uploading the image.')
        }
      }
    } else if (!uploadedImage) {
      if (previewImageUrl && post.imageURL) {
        return post.imageURL
      } else if (!previewImageUrl && post.imageURL) {
        const deleted = await deleteImage(post.imageURL)
        if (deleted) {
          return null
        } else {
          setPreviewImageUrl(post.imageURL)
          return post.imageURL
        }
      }
    }
  }

  const deleteImage = async (url: string) => {
    const imageUrl = new URL(url)
    const key = imageUrl.pathname.split('/').pop()

    if (key) {
      try {
        const res = await fetch(`/api/posts/media/delete/${key}`, {
          method: 'DELETE',
        })

        if (!res.ok) {
          toast.error('An error ocurred while deleting image.')
          return false
        }

        return true
      } catch (err) {
        toast.error('Something happen while deleting image.')
      }
    }
  }

  const handleTopicChange = (e: 'News' | 'Story' | 'Puzzle') => {
    setSelectedTopic(e)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true)
    }
  }, [])

  useEffect(() => {
    if (isMounted) {
      initializeEditor()

      return () => {
        editorRef.current?.destroy()
        editorRef.current = undefined
      }
    }
  }, [isMounted, initializeEditor])

  if (!isMounted) {
    return null
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={handlePostEditing}>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="regular"
          title="Save"
          size="regular"
          className=" w-[4rem] h-12 font-semibold"
          disabled={isSaving || title.length === 0 || title.length > 165}
        >
          {isSaving ? (
            <FontAwesomeIcon icon={faSpinner} className=" animate-spin" />
          ) : (
            'Save'
          )}
        </Button>
        <Button
          type="button"
          variant={post.published ? 'outline' : 'service'}
          title={post.published ? 'Un publish' : 'Publish'}
          size="regular"
          className=" w-[6rem] h-12 font-semibold"
          disabled={isPublishing}
          onClick={handlePostPublishing}
        >
          {isPublishing ? (
            <FontAwesomeIcon icon={faSpinner} className=" animate-spin" />
          ) : post.published ? (
            'Unpublish'
          ) : (
            'Publish'
          )}
        </Button>
      </div>

      <ImageUploader
        onChange={handleImageChange}
        initialImage={post.imageURL}
      />

      <TopicSelection
        selectedTopic={selectedTopic}
        handleTopicChange={handleTopicChange}
      />

      <input
        onChange={handleChange}
        maxLength={165}
        name="title"
        type="text"
        title="Post title"
        placeholder="Title"
        className=" font-inter font-medium text-white-100 text-3xl p-4 pl-0 bg-transparent focus:outline-none placeholder:text-neutral-600"
        disabled={isSaving}
        value={title}
      />

      <div
        id="editor"
        className=" w-full min-h-screen font-roboto flex items-start justify-start prose-h2:text-2xl prose-h2:font-roboto prose-h2:font-medium prose-div:!tracking-wider"
      />
    </form>
  )
}

export { PostEditing }
