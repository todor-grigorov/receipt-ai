using System.Linq.Expressions;

namespace ReceiptAI.Infrastructure.Persistence
{
    public abstract class RepositoryBase<T>(AppDbContext context) : IRepositoryBase<T> where T : class
    {
        protected readonly AppDbContext Context = context;

        public IQueryable<T> FindAll(bool trackChanges) =>
            trackChanges
                ? Context.Set<T>()
                : Context.Set<T>().AsNoTracking();

        public IQueryable<T> FindByCondition(
            Expression<Func<T, bool>> expression,
            bool trackChanges) =>
            trackChanges
                ? Context.Set<T>().Where(expression)
                : Context.Set<T>().Where(expression).AsNoTracking();

        public void Create(T entity) => Context.Set<T>().Add(entity);
        public void Update(T entity) => Context.Set<T>().Update(entity);
        public void Delete(T entity) => Context.Set<T>().Remove(entity);
    }
}
