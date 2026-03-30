export default function ContactForm() {
  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h2 className="text-4xl font-bold mb-6">Contact Us</h2>
      <form className="space-y-4">
        <input type="text" placeholder="Name" className="w-full p-2 bg-gray-900 rounded" />
        <input type="email" placeholder="Email" className="w-full p-2 bg-gray-900 rounded" />
        <textarea placeholder="Message" className="w-full p-2 bg-gray-900 rounded h-32"></textarea>
        <button type="submit" className="bg-blue-900 px-6 py-2 rounded hover:bg-blue-800">Send</button>
      </form>
    </div>
  );
}
