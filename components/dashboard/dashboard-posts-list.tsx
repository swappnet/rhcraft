'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

import { Post } from '@prisma/client'
import { useFilterContext } from '@/app/context/filter.context'
import DashboardLoading from './skeletons/dashboard-home-loading'
import { DashboardPost } from './dashboard-post'

type PostsQueryParams = {
  take?: number
  lastCursor?: string
  date: Date | null
}

const allPosts = async ({ take, lastCursor, date }: PostsQueryParams) => {
  const response = await axios.get('/api/dashboardposts', {
    params: { take, lastCursor, date },
  })
  return response?.data
}

const DashboardPostsList = () => {
  const { ref, inView } = useInView()
  const { date } = useFilterContext()

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isSuccess,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryFn: ({ pageParam = '' }) =>
      allPosts({ take: 10, lastCursor: pageParam, date: date }),
    queryKey: ['posts', date],

    getNextPageParam: (lastPage) => {
      return lastPage?.metaData.lastCursor
    },
  })

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, inView, fetchNextPage, date])

  return (
    <ul className="flex flex-col gap-4 w-full">
      {isSuccess &&
        data?.pages.map((page) =>
          page.data.map((post: Post, index: number) => {
            if (page.data.length === index + 1) {
              return (
                <div ref={ref} key={index}>
                  <DashboardPost
                    key={post.id}
                    title={post.title}
                    createdAt={post.createdAt}
                    imageURL={post.imageURL}
                    id={post.id}
                  />
                </div>
              )
            } else {
              return (
                <DashboardPost
                  key={post.id}
                  title={post.title}
                  createdAt={post.createdAt}
                  imageURL={post.imageURL}
                  id={post.id}
                />
              )
            }
          }),
        )}

      {isLoading || (isFetchingNextPage && !isSuccess) ? (
        <DashboardLoading />
      ) : (
        Array.isArray(data?.pages) &&
        data &&
        data.pages.length > 0 &&
        data?.pages[0].data.length === 0 && (
          <p className="text-center font-sans text-neutral-600 font-semibold">
            There are no posts.
          </p>
        )
      )}
    </ul>
  )
}

export default DashboardPostsList as unknown as () => JSX.Element
