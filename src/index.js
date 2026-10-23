// unkn3wndb.site — static assets + catch-all email forwarding.
//
// fetch: serve the static site from the assets binding (unchanged behaviour).
// email: catch-all (*@unkn3wndb.site) forwards every message to all three
//        verified destination addresses. Destinations must be verified in
//        Cloudflare Email Routing, otherwise forward() rejects for that address.

const DESTINATIONS = [
  "joliciousb4@gmail.com",
  "rbaz9864@gmail.com",
  "samyoggiri048@gmail.com",
];

export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },

  async email(message, env, ctx) {
    if (!message.canBeForwarded) {
      message.setReject("Message cannot be forwarded");
      return;
    }

    const results = await Promise.allSettled(
      DESTINATIONS.map((address) => message.forward(address)),
    );

    let delivered = 0;
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        delivered += 1;
        console.log(
          "forwarded " + message.to + " -> " + DESTINATIONS[i] +
            " id=" + (result.value && result.value.messageId),
        );
      } else {
        const reason = result.reason;
        console.error(
          "forward failed " + message.to + " -> " + DESTINATIONS[i] +
            ": " + ((reason && reason.message) || reason),
        );
      }
    });

    if (delivered === 0) {
      try {
        message.setReject("No verified forwarding destination available");
      } catch (e) {
        console.error("setReject failed: " + e.message);
      }
    }
  },
};
