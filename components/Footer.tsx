import Link from "next/link";

const Footer = () => {
  return (
    <section className="max-w-7xl mx-auto border-t px-4">
      <div className="flex justify-between py-8">
        <p className="text-primary tracking-tight">
          Designed and Developed by{" "}
          <Link href={"https://rahulpradhandev.com"} className="font-bold">
            Rahul Pradhan
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Footer;