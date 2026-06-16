import UserMenu from "./UserMenu";

const Navbar = () => {
  return (
    <nav className="w-full h-[var(--navbar-height)] flex justify-between bg-white border-b border-[#E5E7EB]">
      <div className="h-full flex justify-center items-center">
        <h3 className="font-semibold pl-8">ReceiptAI</h3>
      </div>
      <div className="h-full flex justify-center items-center pr-16">
        <UserMenu />
      </div>
    </nav>
  );
};

export default Navbar;
