const HomePostsLoading = () => {
  return (
    <div className="no-scrollbar flex items-start justify-start gap-8 w-full overflow-x-auto p-2 pl-0">
      {[...Array(3)].map((i) => (
        <div
          key={i}
          className="h-[20rem] rounded flex flex-col items-start justify-center max-w-[24rem] min-w-[20rem] z-10  bg-neutral-700 border-2 border-neutral-600 animate-pulse"
        />
      ))}
    </div>
  )
}

export default HomePostsLoading