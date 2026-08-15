/**
 * Contact form -> email delivery.
 *
 * This site is static (GitHub Pages), so it cannot send mail itself. The form
 * posts to the relay service named in <form action="..."> in index.html, which
 * forwards each submission to islam8bahaa@gmail.com.
 *
 * Currently wired to FormSubmit (https://formsubmit.co) — no account required.
 *
 *   ONE-TIME ACTIVATION: after deploying, submit the form once from the live
 *   site. FormSubmit emails islam8bahaa@gmail.com a confirmation link. Click it
 *   once; every submission after that lands in the inbox automatically.
 *
 * To switch providers later, change ONLY the action attribute in index.html:
 *   Formspree  ->  https://formspree.io/f/<your-id>
 *   Web3Forms  ->  https://api.web3forms.com/submit   (+ hidden access_key input)
 * Both return JSON in the shapes handled by succeeded() below.
 */
(function ($) {
    'use strict';

    var form = $('.contact-form'),
        box = $('.messenger-box-contact__msg'),
        hint = $('#required-msg'),
        button = $('#submit-form');

    if (!form.length) {
        return;
    }

    var DEFAULT_LABEL = button.text(),
        FALLBACK = 'Please email islam8bahaa@gmail.com directly.';

    function show(text, ok) {
        box.stop(true, true)
            .removeClass('alert-success alert-danger')
            .addClass(ok ? 'alert-success' : 'alert-danger')
            .text(text)
            .fadeIn();
    }

    function busy(state) {
        button.prop('disabled', state).text(state ? 'Sending ...' : DEFAULT_LABEL);
    }

    // FormSubmit: {success: "true"} · Formspree: {ok: true} · Web3Forms: {success: true}
    function succeeded(res) {
        if (!res) {
            return false;
        }
        return res.success === true || res.success === 'true' || res.ok === true;
    }

    form.on('submit', function (e) {
        e.preventDefault();

        var el = this,
            action = form.attr('action');

        // Native constraint validation (required, type="email") runs first.
        if (typeof el.checkValidity === 'function' && !el.checkValidity()) {
            hint.addClass('show');
            $(el).find(':invalid').addClass('invalid');
            el.reportValidity();
            return;
        }

        hint.removeClass('show');
        $(el).find('.invalid').removeClass('invalid');

        if (!action) {
            show('The form is not connected yet. ' + FALLBACK, false);
            return;
        }

        busy(true);

        $.ajax({
            url: action,
            type: 'POST',
            data: new FormData(el),
            processData: false,
            contentType: false,
            dataType: 'json',
            headers: { 'Accept': 'application/json' }
        })
            .done(function (res) {
                if (succeeded(res)) {
                    show('Thanks — your message was sent. I will get back to you shortly.', true);
                    el.reset();
                    return;
                }
                // 2xx without a success flag: the relay accepted it but wants a
                // confirmation step (e.g. FormSubmit's first-time activation).
                show((res && res.message) || 'Message received — awaiting confirmation from the mail relay.', true);
                el.reset();
            })
            .fail(function (xhr) {
                var msg = 'Sorry, the message could not be sent. ' + FALLBACK;
                try {
                    var body = JSON.parse(xhr.responseText);
                    if (body && body.message) {
                        msg = body.message;
                    }
                } catch (err) {
                    /* keep the fallback message */
                }
                show(msg, false);
            })
            .always(function () {
                busy(false);
            });
    });

    // Drop the invalid state as soon as the visitor starts fixing the field.
    form.on('input', 'input, textarea', function () {
        $(this).removeClass('invalid');
    });

})(jQuery);
